/**
 * @copyright Alex S. Ducken 2020 alexducken@hydramaster.com
 * HydraMaster LLC
 *
 *@update - refactored to be container for essential HydraMaster Sales Order Scripts 4/15/2021
 *@update - removed setting of custcol_kan_bins no longer needed for management of orders out of Kansas 1/31/2022
 *@update - 6/24/2022 removed setting of list price-stored
 *@update - 6/28/2022 removed setting of expected ship date logic in validate line. We no longer send POs to fuller plastics
 *@update - 10/31/2022 added logic to check PO when copied to clear acknowledge email field and not interrupt automatic email
 *
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([ 'SuiteScripts/Help_Scripts/hm_sweet_alert_2.js',
                    'SuiteScripts/Help_Scripts/Error Alert.js',
                    'N/currentRecord',
                    'N/record',
                    'N/log',
                    'N/search',
                    'N/ui/dialog',
                    'N/runtime'],
function(sAlert,
                errorAlert,
                currentRecord,
                record,
                log,
                search,
                dialog,
                runtime) {

    /**
     * Globals
     */
    let skipValidate = false;
    let scriptContextMode = '';
    const SHIP_INSTRUCTION = {
        1: 'Warranty order – Ground – Prepaid',
        2: 'If LTL - 3rd party bill Aramsco - Use Titan Freight Management Portal @ HTTP://ARAMSCO.SHIPTSG.COM\n' +
            'PO # MUST APPEAR ON ALL PAPERWORK\n' +
            'If UPS – 3rd party bill Aramsco # W0A231\n',
        3: 'LTL - ______ - 3rd Party Bill Jon Don\n' +
            'c/o Freedom Logistics\n' +
            '360 W. Butterfield Rd, Suite 400\n' +
            'Elmhurst, IL 60126\n' +
            'Please State on BOL: "Appointment Required, contact: whse011@jondon.com\n',
        4: 'Ground  - 3rd PARTY Bill Jon-Don - UPS# 57AF14',
        5: 'Ground - PP & Add',
        6: 'LTL - use either YRC #80100 or Estes #0081894\n' +
            '3rd Party Bill Harris Research - Logan, UT\n',
        7: 'NOTE:  Currently, due to a transition in manufacturing, the 1 ½”  Evolution Wand (163-034) is presently being removed from the machine package.  The machine list price has been reduced by $500.\n' +
            'Pricing may differ from your PO.\n' +
            '\n' +
            'Thanks so much for your order!\n' +
            'Bridget\n'
    };

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
        try{
            if(scriptContext.mode == 'copy'){
                scriptContext.currentRecord.setValue({fieldId: 'custbody_pcg_to_be_emailed_sales', value: false, ignoreFieldChange: true});
            }
            scriptContextMode = scriptContext.mode
        }
        catch (e) {
            log.error({title: 'Critical error in pageInit', details: e});
        }
    }

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
            if(scriptContext.fieldId == 'custbody_select_inst_ship'){
                let shipInt = scriptContext.currentRecord.getValue({fieldId: 'custbody_select_inst_ship'});
                scriptContext.currentRecord.setValue({fieldId: 'custbody_pcg_ship_instructions', value: SHIP_INSTRUCTION[shipInt], ignoreFieldChange: true});
                scriptContext.currentRecord.setValue({fieldId: 'custbody_select_inst_ship', value: '', ignoreFieldChange: true});
            }
        }
        catch (e) {
            log.error({title: 'Critical error in fieldChanged', details: e});
        }
    }


    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {
        try {
            if (scriptContext.fieldId == "shipmethod") {
                //Gathering Values
                let checkShipping = scriptContext.currentRecord.getValue({fieldId: "shippingcost"});

                //if shipping cost is to be calculated then set it to zero to effectively cut out the
                //shipping calculator
                if (checkShipping == "To Be Calculated") {
                    scriptContext.currentRecord.setValue({fieldId: "shippingcost", value: 0});
                }
            } else if (scriptContext.fieldId == 'entity' && scriptContext.currentRecord.getValue({fieldId: 'entity'})) {
                let phone = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: scriptContext.currentRecord.getValue({fieldId: 'entity'}),
                    columns: ['phone']
                }).phone;
                if (phone) {
                    try {
                        scriptContext.currentRecord.setValue({fieldId: 'custbody_pcg_contact_phone', value: phone});
                    } catch (error) {
                    }
                }
            }
            else if(scriptContext.fieldId == 'messagesel'){
                if(scriptContext.currentRecord.getValue({fieldId: 'message'}).includes("{today}")){
                    let makeChange = (original) => {
                        let today = new Date().toDateString();
                        return original.replaceAll('{today}', '\n' + today);
                    };
                    scriptContext.currentRecord.setValue({fieldId: 'message', value: makeChange(scriptContext.currentRecord.getValue({fieldId: 'message'}))});
                }
            }
        }
        catch (error){
            log.error({title: 'Critical error in postSourcing', details: error});
        }
    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Defines function for managing manual commit
     * @param{Object}scriptContext
     * @return{boolean}
     */
    let checkManualCommit =  (scriptContext) => {
        try {
            /**
             * Variables for commit control
             */
            let checkType = new Set(['InvtPart', 'Assembly']);
            let currentRecord = scriptContext.currentRecord;
            let itemType = currentRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'itemtype'}); //Sourcing Item Type
            //Checking Item Type to continue
            if(checkType.has(itemType)){
                let commitStatus = search.lookupFields({
                    type: search.Type.ITEM,
                    id: currentRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'item'}),
                    columns: ['custitemcustitem_hm_manual_commit']
                });
                //If manual commit is true set the line item to not auto commit inventory
                if(commitStatus['custitemcustitem_hm_manual_commit']){
                    let role = runtime.getCurrentUser().role;
                    if((role != 3 && role != 1085 && role != 1076 && role != 1078 && role != 1088 && role != 1047) || scriptContextMode == 'create' || scriptContextMode == 'copy') {//Checking if Management or create
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'orderallocationstrategy',
                            value: '',
                            ignoreFieldChange: true
                        });
                        sAlert.fire({
                            icon: 'warning',
                            title: '!WARNING!',
                            text: currentRecord.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item_display'
                                }) +
                                ': is marked as manual commit.'
                        });
                    }
                    else {//If Management allow them to choose to commit or not
                        skipValidate = true;
                        let line = '';
                        let sublistLineValue = currentRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'line'});
                        if(sublistLineValue == '' || sublistLineValue == undefined || sublistLineValue == null){
                            line = currentRecord.getLineCount({sublistId: 'item'});
                        }
                        else{
                            line = currentRecord.findSublistLineWithValue({sublistId: 'item', fieldId: 'line', value: sublistLineValue});
                        }

                        sAlert.fire({
                            title: '!WARNING!',
                            text: currentRecord.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item_display'
                                }) +
                                ': is marked as manual commit.',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Commit',
                            cancelButtonText: 'Do Not Commit'
                        }).then((result) =>{
                            let updateLine = (cStatus) => {
                                currentRecord.selectLine({sublistId: 'item', line: line});
                                currentRecord.setCurrentSublistValue({sublistId: 'item', fieldId: 'orderallocationstrategy', value: cStatus, ignoreFieldChange: true});
                                currentRecord.commitLine({sublistId: 'item', ignoreRecalc: true});
                            };
                            if(result.isConfirmed){
                                updateLine('-2');
                            }
                            else{
                                updateLine('');
                            }
                        }).catch((reason) => {console.log(reason)});
                    }
                }
            }
            return true;
        }
        catch (e) {
            throw 'Error in checkManualCommit: ' + e;
        }
    }

    /**
     * Defines function for testing for replacement parts
     * @param{Object} scriptContext
     */
    let checkForReplacements = (scriptContext) => {
        try{
            let currentRecord = scriptContext.currentRecord;
            let itemType = currentRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'itemtype'});
            let itemId = currentRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'item'});

            if(itemId.length > 0) {
                //Checking if item is a replacement or redirect item.
                let lineItemStatus = search.lookupFields({
                    type: search.Type.ITEM,
                    id: itemId,
                    columns: ['custitem_pcg_status_code', 'custitem_pcg_item_text_notes']
                });
                if (lineItemStatus) {
                    if (lineItemStatus['custitem_pcg_status_code'].length > 0) {
                        let itemStatus = lineItemStatus['custitem_pcg_status_code'][0].value;
                        if (itemStatus == 12) { //Item Redirect Status
                            dialog.alert({
                                message: 'This item is no longer sold by HydraMaster: ' + lineItemStatus['custitem_pcg_item_text_notes'],
                                title: 'Item Redirect'
                            });
                            return false;
                        } else if (itemStatus == 5) { //Item Replacement Status
                            dialog.alert({
                                message: 'This item has been replaced, please copy the new item from the following item notes and replace the line item: ' +
                                    lineItemStatus['custitem_pcg_item_text_notes'],
                                title: 'Item Replacement'
                            });
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        catch (e) {
            throw 'Critical error in checkForReplacements: ' + e;
        }
    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
        try{
            //If skipValidate true setting to false for next line entry and returning true
            if(skipValidate){
                skipValidate = false;
                return true;
            }
            //Tracks if execution should stop or continue if false stops executing additional logic and fails validation
            let keepExecuting = true;

            //Checking Sublist Id before continue
            if(scriptContext.sublistId == 'item'){
                //Collecting and executing item sublist functions
                let onValidateItem = [checkManualCommit, checkForReplacements];
                while (onValidateItem.length && keepExecuting == true) {
                    keepExecuting = onValidateItem.shift().call(this, scriptContext);
                }
            }

            return keepExecuting;
        }
        catch(error){
            log.error({title: 'Critical error in validateLine', details: error});
            errorAlert.errorMessage(error);
            return false;
        }
    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Checks for duplicate customer po if found alerts user
     * @param{Object} scriptContext
     * @return{boolean}
     */
    let findPO = (scriptContext) => {
        try{
            let entity = scriptContext.currentRecord.getValue({fieldId: 'entity'});
            let customerPO = scriptContext.currentRecord.getValue({fieldId: 'otherrefnum'});
            let possiblePO = search.create({
                type: 'salesorder',
                filters: [
                    ["type","anyof","SalesOrd"],
                    "AND",
                    ["otherrefnum","equalto",customerPO],
                    "AND",
                    ["mainline","is","T"],
                    "AND",
                    ["entity", "is", entity]
                ],
                columns:
                    [
                        search.createColumn({name: "trandate", label: "Date"}),
                        search.createColumn({name: "tranid", label: "Document Number"}),
                        search.createColumn({name: "entity", label: "Name"})
                    ]
            }).run().getRange({start: 0, end: 1});
            if(possiblePO.length > 0){
                sAlert.fire({
                    icon: 'error',
                    title: 'Duplicate PO.',
                    text: 'This po is duplicated on another sales order for this same customer.'
                });
                return false;
            }
            else{
                return true;
            }
        }
        catch (e) {
            log.error({title: 'Critical error in findPO', details: e});
        }
    }

    /**
     * Set's the allocation strategy of items on  sales order when saved
     * @param {Object} scriptContext
     * @returns {boolean} Return true if record savable
     */
    function setAllocate(scriptContext){
        try{
            let currentRecord = scriptContext.currentRecord;
            let lines = currentRecord.getLineCount({sublistId: 'item'});
            let shipComplete = currentRecord.getValue({fieldId: 'shipcomplete'});
            if(shipComplete){
                for(let x = 0; x < lines; x++){
                    let manualCommit = search.lookupFields({
                        type: search.Type.ITEM,
                        id: currentRecord.getSublistValue({sublistId: 'item', fieldId: 'item', line: x}),
                        columns: ['custitemcustitem_hm_manual_commit']
                    });
                    if(currentRecord.getSublistValue({sublistId: 'item', fieldId: 'orderallocationstrategy', line: x}) == '-2' && manualCommit.custitemcustitem_hm_manual_commit != true) {
                        currentRecord.selectLine({sublistId: 'item', line: x});
                        currentRecord.setCurrentSublistValue({sublistId: 'item', fieldId: 'orderallocationstrategy', value: '-3'});
                        currentRecord.commitLine({sublistId: 'item'});
                    }
                }
            }
            return true;
        }
        catch (e) {
            log.error({title: 'Critical error in setAllocate', details: e});
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
            //Set false if record cannot be saved
            let canSave = true;

            if(scriptContextMode == 'create' || scriptContextMode == 'copy') {
                //Collecting and executing onSave functions
                let onSave = [findPO, setAllocate];
                while (onSave.length && canSave == true) {
                    canSave = onSave.shift().call(this, scriptContext);
                }
            }

            return canSave;
        }
        catch (e) {
            log.error({title: 'Critical error in saveRecord', details: e});
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
