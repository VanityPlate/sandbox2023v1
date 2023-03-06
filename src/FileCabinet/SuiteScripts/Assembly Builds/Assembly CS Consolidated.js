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
define(['N/currentRecord', 'N/log', 'N/record', 'N/search', 'N/ui/dialog'],
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
             dialog) {

        /**
         * Defines script that fires when record is first loaded
         * @param{Object} context
         */
        function pageInit(context){
            try{
                if(context.mode == 'create'){
                    context.currentRecord.setValue({fieldId: 'location', value: 8});
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
                let completePrefix = `${prefix}-${today.getMonth()+1}${today.getFullYear().toString().slice(-2)}-`;
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
                for(suffix; suffix >= (quantity + suffix); suffix++){
                    output += `${completePrefix}${setSuffix(suffix).toString().padStart(4, '0')}\n`;
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
         * @param {string} fieldChanged - the field that was updated
         * @return {function} promise that handles serial number generation
         */
        let fillSerialNumbers = (recordObj, fieldChanged) => {
            try{
                let promise = new Promise((resolve, reject) =>{
                    try {
                        let item = recordObj.getValue({fieldId: 'item'});
                        let quantity = recordObj.getValue({fieldId: 'quantity'});

                        if(item != '' && quantity != '') {
                            let currentSerials, prefix, reducedCurrent = '';
                            prefix = search.lookupFields({
                                type: search.Type.ITEM,
                                id: item,
                                columns: ['custitem_hm_prefix_serialized']
                            }).custitem_hm_prefix_serialized;
                            if(prefix == ''){
                                recordObj.setValue({fieldId: 'custbody_serial_number_prefix', value: 'No set prefix.', ignoreFieldChange: true});
                                return null;
                            }
                            if(fieldChanged == 'item'){
                                currentSerials = '';
                                recordObj.setValue({fieldId: 'custbody_serial_number_prefix', value: '', ignoreFieldChange: true});
                                quantity = recordObj.getValue({fieldId: 'quantity'});
                            }
                            else {
                                currentSerials = recordObj.getValue({fieldId: 'custbody_serial_number_prefix'});
                                let lines = currentSerials.split(/\r?\n/);
                                let linesDifference = -((lines.length - 1) - quantity) >= 0 ? -((lines.length - 1) - quantity) : -quantity;
                                if(linesDifference == 0){return null;}
                                if(linesDifference > 0){quantity = linesDifference;}
                                else{
                                    for(linesDifference; linesDifference != 0; linesDifference++){
                                        reducedCurrent = `${lines[Math.abs(linesDifference) - 1]}\n${reducedCurrent}`;
                                    }
                                }
                            }
                            recordObj.setValue({
                                fieldId: 'custbody_serial_number_prefix',
                                value: !reducedCurrent ? `${currentSerials}${makeSerials(quantity, prefix)}` : reducedCurrent,
                                ignoreFieldChange: true
                            });
                        }
                        //Do nothing if both fields are incomplete.
                    }
                    catch (e) {
                        //Refactor Testing
                        reject(console.log(`Error in promise:  + ${e}`));
                    }
                });
                return promise;
            }
            catch (e) {
                log.error({title: 'Critical error in fillSerialNumbers', details: e});
            };
        };

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            try{
                if(scriptContext.fieldId == 'item'){
                    fillSerialNumbers(scriptContext.currentRecord, scriptContext.fieldId);
                }
                if(scriptContext.fieldId == "quantity"){
                    fillSerialNumbers(scriptContext.currentRecord, scriptContext.fieldId);
                }
            }
            catch (e) {
                log.error({title: 'Critical error in fieldChanged', details: e});
            }
        }

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
            fieldChanged: fieldChanged,
        };
    });
