/**
 *
 * @copyright Alex S. Ducken 2023 alexducken@gmail.com
 * HydraMaster LLC
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record'],
    
    (record) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (context) => {
            try{
                if(context.request.method === 'GET') {
                    let recID = context.request.parameters['custscript_recid'];
                    let salesOBJ = record.load({
                        type: record.Type.SALES_ORDER,
                        id: recID
                    });

                    //Refactor Testing
                    log.audit({title: 'Testing fire', details: `FIRED${recID}`});

                    let items = salesOBJ.getLineCount({sublistId: 'item'});
                    for (let x = 0; x < items; x++) {
                        if(salesOBJ.getSublistValue({sublistId: 'item', fieldId: 'inventorydetailavail'}) == 'T'){
                            salesOBJ.removeCurrentSublistSubrecord({sublistId: 'item', fieldId: 'inventorydetail'});
                        }
                    }

                    salesOBJ.save()
                }
            }
            catch (e) {
                log.error({title: 'Critical error in onRequest', details: e});
            }
        }

        return {onRequest}

    });
