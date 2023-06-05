/**
 *
 * @copyright Alex S. Ducken 2022 alexducken@hydramaster.com
 * HydraMaster LLC
 *
 * @update 2/29/2022 adding logic for ready to ship, refactor afterSubmit
 * @update - 6/5/2023 adding button to handle inventory detail issue preventing shipment
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/search", 'N/runtime', 'SuiteScripts/Shipping/Shipping Lib.js'],
    
    (search, runtime, shipLib) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            try{
                if(scriptContext.type == 'view' &&
                    (scriptContext.newRecord.getValue({fieldId: 'status'}) == 'pendingFulfillment')){
                    scriptContext.form.addButton({
                        id: 'custpage_clear_id',
                        label: 'Clear IDs',
                        functionName: 'clearIDS'
                    });
                    scriptContext.form.clientScriptModulePath = 'SuiteScripts/Sales Order Scripts/Sales CS Consolidated.js';
                }
            }catch (e) {
                log.error({title: 'Critical error in beforeLoad', details: e});
            }
        }

            /**
             *Handles setting of allocation for international orders. Keeps them from committing inventory and does not
             * interfere with previously made commitments
             * If executed, takes place in beforeSubmit context
             * @param {Record} currentRecord - the currentRecord
             */
            const setInternationalCommit = (currentRecord) => {
                    try{
                                    let items = currentRecord.getLineCount({sublistId: 'item'});
                                    for (let x = 0; x < items; x++) {
                                            let allocation = currentRecord.getSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'orderallocationstrategy',
                                                    line: x
                                            });
                                            //Refactor Testing
                                            //log.audit({title: 'Testing supply allocation', details: allocation});
                                            if (allocation != 3) {
                                                    currentRecord.setSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'orderallocationstrategy',
                                                            line: x,
                                                            value: ''
                                                    });
                                            }
                                    }
                    }
                    catch (e) {
                            log.error({title: 'Critical error in setInternationalCommit', details: e});
                    }
            }

            /**
             * Defines function for managing commitment of Machine Orders
             * @param{object} scriptContext
             */
            let manageMachineOrders = (scriptContext) =>{
                    try{
                          if(scriptContext.type == 'create') {
                                  let recordObj = scriptContext.newRecord;
                                  let lines = recordObj.getLineCount({sublistId: 'item'});
                                  let machines = shipLib.MACHINE_ITEM_CLASS;
                                  for (let x = 0; x < lines; x++) {
                                          if (machines.includes(Number(recordObj.getSublistValue({
                                                  sublistId: 'item',
                                                  fieldId: 'class',
                                                  line: x
                                          })))) {
                                                  for (let y = 0; y < lines; y++) {
                                                          recordObj.setSublistValue({
                                                                  sublistId: 'item',
                                                                  fieldId: 'orderallocationstrategy',
                                                                  line: y,
                                                                  value: ''
                                                          });
                                                  }
                                                  break;
                                          }
                                  }
                          }
                    }
                    catch (e) {
                            log.error({title: 'Critical Error in manageMachineOrders', details: e});
                    }
            }

            /**
             * Defines function setting back door status on new orders
             * @param{Object} scriptContext
             * @return boolean
             */
            let setLTLShipping = (scriptContext) => {
                    try{
                            //Refactor Testing
                            log.audit({title: 'Testing setLTLShipping', details: 'test'});
                            let lines = scriptContext.newRecord.getLineCount({sublistId: 'item'});
                            for(let x = 0; x < lines; x++){
                                    //Refactor Testing
                                    log.audit({title: 'Testing setLTLShipping', details: scriptContext.newRecord.getSublistValue({sublistId: 'item', line: x, fieldId: 'custcol_hm_ltl_shipping'})});
                                  if(scriptContext.newRecord.getSublistValue({sublistId: 'item', line: x, fieldId: 'custcol_hm_ltl_shipping'})){
                                          //Refactor Testing
                                          log.audit({title: 'Is LtL', details: 'Yes'});
                                          scriptContext.newRecord.setValue({fieldId: 'custbody_ltl_sales_order', value: true, ignoreFieldChange: true});
                                          return true;
                                  }
                            }
                            return false;
                    }
                    catch (e) {
                            log.error({title: 'Critical error in setLTLShipping', details: e});
                    }
            }


            /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
                try{
                        let runMachineManage = false;
                        let runInt = runtime.getCurrentScript().getParameter({name: 'custscript_run_int_control_so_ues'});
                        if(runInt == 'on') {
                                let customerInternational = search.lookupFields({
                                        type: search.Type.CUSTOMER,
                                        id: scriptContext.newRecord.getValue({fieldId: 'entity'}),
                                        columns: ['custentity_international_customer']
                                });
                                if (customerInternational["custentity_international_customer"]) {
                                        //Refactor Testing
                                        //log.debug({title: 'testing international lookup', details: customerInternational});
                                        setInternationalCommit(scriptContext.newRecord);
                                }
                                else{
                                        runMachineManage = true;
                                }
                        }
                        if(runMachineManage){
                                manageMachineOrders(scriptContext);
                                //setLTLShipping(scriptContext); //Redundant
                        }
                }
                catch (e) {
                        log.error({title: 'Critical error in afterSubmit', details: e});
                }
        }

        /**
         * Defines function for managing back door chem orders
         * @param {Record} recordObj
         */
        let backDoorChem = (recordObj) => {
                try{
                        let shouldSave = false;
                        let lines = recordObj.getLineCount({sublistId: 'item'});
                        for(let x = 0; x < lines; x++){
                                let itemClass = recordObj.getSublistValue({sublistId: 'item', line: x, fieldId: 'class'});
                                if(itemClass == 19){
                                        recordObj.setSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'orderallocationstrategy',
                                                line: x,
                                                value: ''
                                        });
                                        shouldSave = true
                                }
                        }
                        if(shouldSave){
                                recordObj.save();
                        }
                }
                catch (e) {
                        log.error({title: 'Critical error in backDoorChem', details: e});
                }
        }

            /**
             * Defines function for calling ready to ship logic and checking if it should be called
             * @param{Record} newRecord
             * @return{boolean}
             */
            let callShipLogic = (newRecord) => {
                    try{
                            let typeSet = new Set(['D', 'E', 'B']);
                            let orderStatus = newRecord.getValue({fieldId: 'orderstatus'});
                            if (!typeSet.has(orderStatus)) {
                                    return true;
                            }
                            else{
                                    shipLib.CHECK_READY_SHIP(newRecord.getValue({fieldId: 'id'}));
                                    return  true;
                            }
                    }
                    catch (e) {
                            log.error({title: 'Critical error in callShipLogic', details: e});
                    }
            }

            /**
             * Defines function for setting chem commit logic
             * @param{Object} scriptContext
             * @return{boolean}
             */
            let chemCommitLogic = (scriptContext) => {
                    try{
                            let chemCOMMIT = runtime.getCurrentScript().getParameter({name: 'custscript_chemical_commit_so_ues'});
                            let backDoor = scriptContext.newRecord.getValue({fieldId: 'custbody_ltl_sales_order'});
                            if(chemCOMMIT == 'on' && "create" == scriptContext.type && backDoor){
                                    //Refactor Testing
                                    //log.audit({title: 'testing chemCOMMIT', details: chemCOMMIT});
                                    let recordObj = record.load({
                                            id: scriptContext.newRecord.getValue({fieldId: 'id'}),
                                            type: record.Type.SALES_ORDER
                                    });
                                    backDoorChem(recordObj);
                            }
                            return true;
                    }
                    catch (e) {
                            log.error({title: 'Critical error in chemCommitLogic', details: e});
                    }
            }

            /**
             * Defines function for adding core charges. Save search core charge application controls the application of
             * this logic.
             * @param {Object} scriptContext
             * @return null
             */
            let coreCharge = (scriptContext) => {
                    try{
                            //Default Core Charge
                            let coreCharge = 28943;

                        let checkSetting = runtime.getCurrentScript().getParameter({name : 'custscript_apply_core_charge'});
                        let recordID = scriptContext.newRecord.id;
                        let checkToRun = search.load({id: 'customsearch_core_charge_application'});
                        checkToRun.filterExpression.push('AND');
                        checkToRun.filterExpression.push(['internalid', 'anyof', recordID]);
                        checkToRun = checkToRun.run().getRange({start: 0, end: 1});
                        if(checkSetting == 'on' && checkToRun.length > 0){
                                let currentCharges = 0;
                                let currentShafts = checkToRun[0].getValue({name: 'quantity', summary: 'SUM'});
                                let getCurrentCoreCharge = search.create({
                                        type: "salesorder",
                                        filters:
                                            [
                                                    ['internalid', 'anyof', recordID],
                                                    "AND",
                                                    ["item","anyof",coreCharge]
                                            ],
                                        columns:
                                            [
                                                    search.createColumn({
                                                            name: "quantity",
                                                            summary: "SUM",
                                                            label: "Quantity"
                                                    })
                                            ]
                                }).run().getRange({start: 0, end: 1});
                                if(getCurrentCoreCharge.length > 0){
                                        currentCharges =  getCurrentCoreCharge[0].getValue({name: 'quantity', summary: 'SUM'});
                                }
                                if(currentCharges != currentCharges){
                                        let recordObj = record.load({type: record.Type.SALES_ORDER, id: scriptContext.newRecord.id});
                                }
                        }
                    }
                    catch (e) {
                            log.error({title: 'Critical error in coreCharge', details: e});
                    }
            }

            /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
                try{
                        callShipLogic(scriptContext.newRecord);
                        chemCommitLogic(scriptContext);
                        //Refactor Testing
                        //coreCharge(scriptContext);
                }
                catch (e) {
                        log.error({title: 'Critical error in afterSubmit', details: e});
                }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
