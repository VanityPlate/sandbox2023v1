/**
 *
 * @copyright Alex S. Ducken 2022 alexducken@gmail.com
 * HydraMaster LLC
 *
 * @NApiVersion 2.1
 * @NScriptType MassUpdateScript
 */
define(['N/record', 'N/search'],
    
    (ssrecord, search) => {
        /**
         * Defines the Mass Update trigger point.
         * @param {Object} params
         * @param {string} params.type - Record type of the record being processed
         * @param {number} params.id - ID of the record being processed
         * @since 2016.1
         */
        const each = (params) => {
            try{

                //Creates object saving line item data for splitting
                let holdInfo = (record, line, quantity = null, shipped = null) => {
                    if(quantity != null && shipped != null) {
                        let billed = record.getSublistValue({sublistId: 'item', line: line, fieldId: 'quantitybilled'});
                        let amount = record.getSublistValue({sublistId: 'item', line: line, fieldId: 'amount'});
                        let hasPO = record.getSublistValue({sublistId: 'item', line: line, fieldId: 'createpo'});
                        let price = record.getSublistValue({sublistId: 'item', line: line, fieldId: 'price'});
                        let item = record.getSublistValue({sublistId: 'item', line: line, fieldId: 'item'});
                        let lineSurcharge = record.getSublistValue({sublistId: 'item', line: x, fieldId: 'custcol_line_surcharge'}) ? record.getSublistValue({sublistId: 'item', line: x, fieldId: 'custcol_line_surcharge'}) : false;
                        let retail = search.lookupFields({type: search.Type.ITEM, id: item, columns: ['baseprice']}).baseprice;
                        let discount = search.lookupFields({
                            type: search.Type.PRICE_LEVEL,
                            id: price,
                            columns: ['discountpct']
                        }).discountpct;
                        discount = discount ? (100.0 + Number(discount.replace('%', ''))) / 100 : 0;
                        return {
                            price: price,
                            item: item,
                            quantity: quantity - shipped,
                            billed: billed,
                            amount: amount,
                            hasPO: hasPO,
                            retail: retail,
                            discount: discount,
                            updatedRate: retail * discount,
                            lineSurcharge: lineSurcharge
                        };
                    }
                    return null;
                }

                //Array of New Lines
                let linesToAdd = [];

                let record = ssrecord.load({type: params.type, id: params.id, isDynamic: false});
                let quantity, shipped, collection, replaceLineSurcharge;

                for(let x = 0; x < record.getLineCount({sublistId: 'item'}); x++) {
                    quantity = record.getSublistValue({sublistId: 'item', line: x, fieldId: 'quantity'});
                    shipped = record.getSublistValue({sublistId: 'item', line: x, fieldId: 'quantitypickpackship'});
                    collection = holdInfo(record, x, quantity, shipped);
                    if (quantity > 0 && collection.amount > 0 && collection.billed < quantity && collection.price != -1) {
                        //Refactor Testing
                        log.audit({title: 'Base Price', details: JSON.stringify(collection.retail)});
                        log.audit({title: 'discount', details: JSON.stringify(collection.discount)});
                        log.audit({title: 'updatedRate', details: JSON.stringify(collection.updatedRate)});
                        if (shipped > 0 && collection.hasPO != "DropShip") {
                            linesToAdd.push(collection);
                            record.setSublistValue({sublistId: 'item', fieldId: 'quantity', value: collection.shipped, line: x});
                            if(collection.billed > 0 && collection.lineSurcharge){
                                collection.lineSurcharge = Number(collection.lineSurcharge);
                                replaceLineSurcharge = (collection.lineSurcharge / quantity) * collection.billed;
                            }
                        } else {
                            record.setSublistValue({sublistId: 'item', fieldId: 'rate', value: collection.updatedRate, line: x});
                            record.setSublistValue({sublistId: 'item', fieldId: 'amount', value: (collection.updatedRate * collection.quantity), line: x});
                            record.setSublistValue({sublistId: 'item', fieldId: 'custcol_pcg_list_price', value: collection.retail, line: x});
                        }
                    }
                }
                if (linesToAdd.length > 0) {
                    for (let x = 0; x < linesToAdd.length; x++) {
                        let nextLine = record.getLineCount({sublistId: 'item'});
                        record.setSublistValue({sublistId: 'item', fieldId: 'item', value: linesToAdd[x].item, line: nextLine});
                        record.setSublistValue({sublistId: 'item', fieldId: 'quantity', value: linesToAdd[x].quantity, line: nextLine});
                        record.setSublistValue({sublistId: 'item', fieldId: 'price', value: linesToAdd[x].price, line: nextLine});
                        record.setSublistValue({sublistId: 'item', fieldId: 'rate', value: linesToAdd[x].updatedRate, line: nextLine});
                        record.setSublistValue({sublistId: 'item', fieldId: 'amount', value: (linesToAdd[x].updatedRate * linesToAdd[x].quantity), line: nextLine});
                        record.setSublistValue({sublistId: 'item', fieldId: 'custcol_pcg_list_price', value: linesToAdd[x].retail, line: nextLine});
                    }
                }


                record.save();
            }
            catch (e) {
                log.error({title: 'Critical error in each', details: e});
            }
        }

        return {each}

    });
