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
                        return {
                            currentPriceLevel: record.getSublistValue({
                                fieldId: 'price',
                                line: line,
                                sublistId: 'item'
                            }),
                            item: record.getLineCount({
                                fieldId: 'item',
                                line: line,
                                sublistId: 'item'
                            }),
                            quantity: quantity - shipped
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
                    let billed = record.getSublistValue({sublistId: 'item', line: x, fieldId: 'quantitybilled'});
                    let amount = record.getSublistValue({sublistId: 'item', line: x, fieldId: 'amount'});
                    let hasPO = record.getSublistValue({sublistId: 'item', line: x, fieldId: 'createpo'});
                    let price = record.getSublistValue({sublistId: 'item', line: x, fieldId: 'price'});
                    let item = record.getSublistValue({sublistId: 'item', line: x, fieldId: 'item'});
                    let retail = search.lookupFields({type: search.Type.ITEM, id: item, columns: ['baseprice']});
                    let discount = search.lookupFields({
                        type: search.Type.PRICE_LEVEL,
                        id: price,
                        columns: ['discountpct']
                    });
                    //Refactor Testing
                    log.audit({title: 'Base Price', details: JSON.stringify(retail)});
                    log.audit({title: 'discount', details: JSON.stringify(discount)});
                    if (amount > 0 && billed < quantity) {
                        if (shipped > 0 && hasPO != "DropShip" && price != -1) {
                            linesToAdd.push(holdInfo(record, x, quantity, shipped));
                            //Refactor Testing
                            //record.setSublistValue({sublistId: 'item', fieldId: 'quantity', value: shipped, line: x});
                        } else if (price != -1) {
                            let costing = record.getSublistValue({sublistId: 'item', fieldId: 'price', line: x});
                            //Refactor Testing
                            //record.setSublistValue({sublistId: 'item', fieldId: 'price', value: 1, line: x});
                            //record.setSublistValue({sublistId: 'item', fieldId: 'price', costing, line: x});}
                        }
                    }

                    if (linesToAdd.length > 0) {
                        for (let x = 0; x < linesToAdd.length; x++) {
                            let nextLine = record.getLineCount({sublistId: 'item'});
                            //Refactor Testing
                            //record.setSublistValue({sublistId: 'item', fieldId: 'item', value: linesToAdd[x].item, line: nextLine});
                            //record.setSublistValue({sublistId: 'item', fieldId: 'quantity', value: linesToAdd[x].quantity, line: nextLine});
                            //record.setSublistValue({sublistId: 'item', fieldId: 'price', value: linesToAdd[x].currentPriceLevel, line: nextLine});
                        }
                    }

                    record.save();
                }
            }
            catch (e) {
                log.error({title: 'Critical error in each', details: e});
            }
        }

        return {each}

    });
