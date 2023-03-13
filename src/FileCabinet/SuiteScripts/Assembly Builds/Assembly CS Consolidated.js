/**
 *
 * @update 4/4/2022 Added Seriel AB.js for consolidation
 * @update 3/2/2023 Adding function for managing serial numbers and deprecating PCG solution
 *
 * @copyright Alex S. Ducken 2020 HydraMaster LLC
 *
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord',
                    'N/log',
                    'N/record',
                    'N/search',
                    'N/ui/message'],
    /**
     * @param{currentRecord} currentRecord
     * @param{log} log
     * @param{record} record
     * @param{search} search
     */
    function(currentRecord,
             log,
             record,
             search,
             message) {

        /**
         * Defines script that fires when record is first loaded
         * @param{Object} context
         */
        function pageInit(context){
            try{
                if(context.mode == 'create'){
                    context.currentRecord.setValue({fieldId: 'location', value: 8});
                }
                else if(context.mode != 'create'){
                    //Do not alter without consideration for serial # creation's reliance on these values
                    let recordObj = currentRecord.get();
                    recordObj.getField({fieldId: 'quantity'}).isDisabled = true;
                    recordObj.getField({fieldId: 'item'}).isDisabled = true;
                }
            }
            catch (e) {
                log.error({title: 'Critical error in pageInit', details: e});
            }
        }

        /**
         * Function to generate new unused serial numbers
         * @param {int} quantity - the number of serial numbers to make
         * @param {string} prefix - the prefix for serial numbers
         * @return {string}
         */
        let makeSerials = (quantity, prefix) => {
            try{
                let output = '';
                let today = new Date();
                let suffix = Math.floor(Math.random() * 1000);
                quantity += suffix;
                let completePrefix = `${prefix}-${(today.getMonth()+1).toString().padStart(2, '0')}${today.getFullYear().toString().slice(-2)}-`;
                /**
                 * Function to confirm serial number is valid, recalculates to find a new serial number and returns suffix that works
                 * @param {number} suffix
                 * @return {number}
                 */
                let setSuffix = (suffix) => {
                    try{
                        do{
                            let filters =   [
                                ["inventorynumber.inventorynumber","is",`${completePrefix}${suffix}`]
                            ];
                            let inUse = search.create({
                                type: search.Type.INVENTORY_DETAIL,
                                filters: filters
                            }).run().getRange({start: 0, end: 5});

                            if(inUse.length <= 0){
                                break;
                            }
                            else{
                                suffix = (suffix + 31) % 1000;
                            }
                        }while(true);
                        return suffix;
                    }
                    catch (e) {
                        throw `Critical error in setAffix: ${e}`;
                    }
                }
                for(suffix; suffix < quantity; suffix++){
                    output += `${completePrefix}${setSuffix(suffix).toString().padStart(3, '0')}\n`;
                }
                return output;
            }
            catch (e) {
                throw `Critical error in makeSerials: ${e}`;
            }
        };

        /**
         * Function to generate promise to create and fill serial numbers
         * @param {Record} recordObj - the current record
         * @return {boolean} true - save record, false - do not save record
         */
        let fillSerialNumbers = (recordObj) => {
            try{
                let item = recordObj.getValue({fieldId: 'item'});
                let quantity = recordObj.getValue({fieldId: 'quantity'});

                if(item != '' && quantity != '') {
                    let prefix = search.lookupFields({
                        type: search.Type.ITEM,
                        id: item,
                        columns: ['custitem_hm_prefix_serialized']
                    }).custitem_hm_prefix_serialized;
                    if(prefix == ''){
                        recordObj.setValue({fieldId: 'custbody_serial_number_prefix', value: 'No set prefix.', ignoreFieldChange: true});
                        return true; //no prefix suggest not a serialized assembly
                    }
                    recordObj.setValue({
                        fieldId: 'custbody_serial_number_prefix',
                        value: makeSerials(quantity, prefix),
                        ignoreFieldChange: true
                    });
                    return true;
                }
                else{
                    let alertMessage = message.create({
                        title: 'Incomplete Fields',
                        type: message.Type.WARNING,
                        message: 'Complete the required fields Assembly and Quantity to Build.'
                    });
                    alertMessage.show({duration: 10000});
                    return false;
                }
            }
            catch (e) {
                log.error({title: 'Critical error in fillSerialNumbers', details: e});
                return false;
            }
        };

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
            try{
                if(scriptContext.currentRecord.getValue({fieldId: 'custbody_serial_verified'})){
                    return true;
                }

                //Retrieving the sub-record to check its serial numbers
                var invDetails = scriptContext.currentRecord.getValue({fieldId: 'inventorydetailreq'});

                //No serial numbers to test against allowing save.
                if (invDetails === 'F'){
                    scriptContext.currentRecord.setValue({fieldId: 'custbody_serial_verified', value: true});
                    return true;
                }

                //Array for holding duplicate serial numbers
                var duplicates = [": "];

                //Iterating though the sublist on the sub-record checking that the serial number has not been used
                //previously
                invDetails = scriptContext.currentRecord.getSubrecord({fieldId: 'inventorydetail'});
                var lines = invDetails.getLineCount({sublistId: 'inventoryassignment'});
                for(var x = 0; x < lines; ++x){
                    //retrieving the current serial number
                    invDetails.selectLine({sublistId: 'inventoryassignment', line: x});
                    var serialNumber = invDetails.getCurrentSublistValue(
                        {sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber'});

                    //creating and running a search to see if the current serial number is already in use
                    var filters =   [
                        ["inventorynumber.inventorynumber","is",serialNumber]
                    ];
                    var inUse = search.create({
                        type: search.Type.INVENTORY_DETAIL,
                        filters: filters
                    }).run().getRange({start: 0, end: 5});

                    //If there are any results add the duplicate serial number to alert user
                    if(inUse.length>1){
                        duplicates.push(serialNumber);
                    }
                }
                //if duplicates has more than the initial variable alert the user and return false to stop the save
                //otherwise return true to allow the saving of the Assembly Build
                if(duplicates.length > 1){
                    dialog.alert({title: "SAVE FAILED!", message: "The following Serial#s are duplicates" + duplicates}).then(success).catch(failure);
                    return false;
                }
                else{
                    scriptContext.currentRecord.setValue({fieldId: 'custbody_serial_verified', value: true});
                    return true;
                }
            }
            catch(error){
                log.audit({title: "Critical Error in saveRecord", details: error});
                return false;
            }
        }
        return {
            saveRecord: saveRecord,
            pageInit: pageInit,
        };
    });
