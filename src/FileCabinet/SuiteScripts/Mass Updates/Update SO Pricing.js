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
                        let retail = search.lookupFields({type: search.Type.ITEM, id: item, columns: ['baseprice']});
                        let discount = search.lookupFields({
                            type: search.Type.PRICE_LEVEL,
                            id: price,
                            columns: ['discountpct']
                        });
                        return {
                            price: price,
                            item: item,
                            quantity: quantity - shipped,
                            billed: billed,
                            amount: amount,
                            hasPO: hasPO,
                            retail: retail.baseprice,
                            discount: 100 - discount.discountpct.STRING.replace('%', ''),
                            updatedRate: this.retail * this.discount
                        };
                    }
                    return null;
                }

                //Array of New Lines
                let linesToAdd = [];

                let record = ssrecord.load({type: params.type, id: params.id, isDynamic: false});

                for(let x = 0; x < record.getLineCount({sublistId: 'item'}); x++) {
                    let quantity = record.getSublistValue({sublistId: 'item', line: x, fieldId: 'quantity'});
                    let shipped = record.getSublistValue({sublistId: 'item', line: x, fieldId: 'quantitypickpackship'});
                    let collection = holdInfo(record, x, quantity, shipped);
                    if (quantity > 0 && collection.amount > 0 && collection.billed < quantity && collection.price != -1) {
                        //Refactor Testing
                        log.audit({title: 'Base Price', details: JSON.stringify(collection.retail)});
                        log.audit({title: 'discount', details: JSON.stringify(collection.discount)});
                        if (shipped > 0 && collection.hasPO != "DropShip") {
                            linesToAdd.push(collection);
                            //Refactor Testing
                            //record.setSublistValue({sublistId: 'item', fieldId: 'quantity', value: collection.shipped, line: x});
                        } else {
                            //Refactor Testing
                            //record.setSublistValue({sublistId: 'item', fieldId: 'rate', value: collection.updatedRate, line: x});
                            //record.setSublistValue({sublistId: 'item', fieldId: 'amount', value: (collection.updatedRate * collection.quantity), line: x});
                            //record.setSublistValue({sublistId: 'item', fieldId: 'custcol_pcg_list_price', value: collection.retail, line: x});
                        }
                    }

                    if (linesToAdd.length > 0) {
                        for (let x = 0; x < linesToAdd.length; x++) {
                            let nextLine = record.getLineCount({sublistId: 'item'});
                            //Refactor Testing
                            //record.setSublistValue({sublistId: 'item', fieldId: 'item', value: linesToAdd[x].item, line: nextLine});
                            //record.setSublistValue({sublistId: 'item', fieldId: 'quantity', value: linesToAdd[x].quantity, line: nextLine});
                            //record.setSublistValue({sublistId: 'item', fieldId: 'price', value: linesToAdd[x].price, line: nextLine});
                            //record.setSublistValue({sublistId: 'item', fieldId: 'rate', value: collection.updatedRate, line: nextLine});
                            //record.setSublistValue({sublistId: 'item', fieldId: 'amount', value: (collection.updatedRate * collection.quantity), line: nextLine});
                            //record.setSublistValue({sublistId: 'item', fieldId: 'custcol_pcg_list_price', value: collection.retail, line: nextLine});
                        }
                    }

                    //Refactor Testing
                    //record.save();
                }
            }
            catch (e) {
                log.error({title: 'Critical error in each', details: e});
            }
        }

        return {each}

    });
