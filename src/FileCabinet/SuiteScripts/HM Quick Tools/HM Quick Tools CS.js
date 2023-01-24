/**
 *
 * @copyright Alex S. Ducken 2022 alexducken@gmail.com
 * HydraMaster LLC
 *
 * @update 7/19/2022 adding Bom Obsolete to HM quick tools
 * @update 1/24/2023 adding Get Monthly Open SO Report
 *
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../Help_Scripts/Load_Unknown_Record_Type.js',
                    '../Help_Scripts/Get_Internal.js',
                    'N/record',
                    'N/currentRecord',
                    'SuiteScripts/Help_Scripts/hm_sweet_alert_2.js',
                    'N/url',
                    'SuiteScripts/Help_Scripts/schedulerLib.js',
                    'N/runtime',
                    'N/https',
                    'N/search'],

function(loadUnknown,
                getInternal,
                record,
                currentRecord,
                sAlert,
                url,
                schedulerLib,
                runtime,
                https,
                search) {

    /**
     * Incomplete Fields Alert: returns true if empty strings and alerts user, returns false otherwise.
     * @param {string} fieldOne
     * @param {string} fieldTwo
     * @return {boolean}
     */
    let incompleteFields = (fieldOne, fieldTwo = 'fill') => {
        try{
            if(fieldOne == '' || fieldTwo == ''){
                sAlert.fire({
                    icon: 'warning',
                    text: 'Please fill in dates under header of button you\'ve clicked.',
                    title: 'Incomplete Fields'
                });
                return true;
            }
            else{
                return false;
            }
        }
        catch (e) {
            throw "Critical error in incompleteFields: " + e;
        }
    }

    /**
     * Button Click for Bom Obsolete
     */
    let bomObsolete = () => {
        try{
            let recordObj = currentRecord.get();
            let itemObsolete = recordObj.getValue({fieldId: 'custapge_item_to_obsolete'});
            if(incompleteFields(itemObsolete)){
                //Do Nothing
            }
            else {
                let type = search.lookupFields({
                    type: search.Type.ITEM,
                    id: itemObsolete,
                    columns: ['type']
                }).type[0].value;
                if(type == 'Assembly') {
                    sAlert.fire({
                        icon: 'info',
                        title: 'Request Received',
                        text: 'Process is Running. Your results will be emailed to you.'
                    });
                    let output = url.resolveScript({
                        deploymentId: schedulerLib.hmSchDef.deploymentID,
                        scriptId: schedulerLib.hmSchDef.scriptID,
                        params: {scriptName: 'bomObsolete', script_parameters: JSON.stringify({custscript_item_bomo: itemObsolete})}
                    });
                    https.get({
                        url: output
                    });
                }
                else{
                    sAlert.fire({
                        icon: 'error',
                        title: 'Wrong Type',
                        text: 'Bom Obsolete only works on assemblies.'
                    });
                }
            }
        }
        catch (e) {
            throw 'Critical error in bomObsolete: ' + e;
        }
    }

    /**
     * Button Click Link Item to Specification
     */
    let setSpec = () => {
        try{
            let recordObj = currentRecord.get();
            let spec = recordObj.getValue({fieldId: 'custpage_spec'});
            let item = recordObj.getValue({fieldId: 'custpage_spec_item'});
            if(incompleteFields(spec, item)){
                //Do Nothing
            }
            else{
                let itemId = getInternal.item(item);
                //Check Spec
                if(!getInternal.findFile(spec)){
                    sAlert.fire({
                        icon: 'warning',
                        text: 'Could not find the file you specified inside specification folder.',
                        title: 'Bad File Id'
                    });
                }
                //Check Item
                else if(itemId == null){
                    sAlert.fire({
                        icon: 'warning',
                        text: 'The item you entered could not be sourced.',
                        title: 'Bad Item Name'
                    });
                }
                //Set Spec
                else{
                    sAlert.fire({
                       icon: 'success',
                       text: 'Yov\'ve updated the item specification',
                       title: 'Item Updated'
                    });
                    let promise = new Promise(function(resolve, reject){
                        recordObj = loadUnknown.recursiveLoad(itemId, 0);
                        recordObj.setValue({fieldId: 'custitem_item_spec_hidden', value: spec, ignoreFieldChange: true});
                        recordObj.save();
                    });
                    return promise;
                }
            }
        }
        catch (e) {
            throw "Critical error in setSpec: " + e;
        }
    }

    /**
     * Button Click Open SO Report
     */
    let openSOReport = () => {
        try{
            let scriptActive = schedulerLib.anotherDeploymentIsExecuting(schedulerLib.scripts.monthlyOnOrder.scriptId, schedulerLib.scripts.monthlyOnOrder.deploymentID);
            if(!scriptActive){
                let currentUser = runtime.getCurrentUser();
                let userEmail = currentUser.email;
                sAlert.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'You will receive an email with a csv shortly.'
                });
                let output = url.resolveScript({
                    deploymentId: schedulerLib.hmSchDef.deploymentID,
                    scriptId: schedulerLib.hmSchDef.scriptID,
                    params: {scriptName: 'monthlyOnOrder', script_parameters: JSON.stringify({custscript_user_email: userEmail})}
                });
                https.get({
                    url: output
                });
            }
            else{
                sAlert.fire({
                    icon: 'warning',
                    title: 'Notice!',
                    text: 'The script is currently running wait a moment and try again.'
                });
            }
        }
        catch (e) {
            log.audit({title: 'Critical error in openSOReport', details: e});
        }
    }

    /**
     * Button Click Get Warranty GL
     */
    let getWarrantyGL = () => {
        try{
            let recordObj = currentRecord.get();
            let startDate = recordObj.getText({fieldId: 'custpage_gwgl_start_date'});
            let endDate = recordObj.getText({fieldId: 'custpage_gwgl_end_date'});
            if(incompleteFields(startDate, endDate)){
                //Do Nothing
            }
            else{
                let scriptActive = schedulerLib.anotherDeploymentIsExecuting(schedulerLib.scripts.getWarrantyGL.scriptId, schedulerLib.scripts.getWarrantyGL.deploymentID);
                if(!scriptActive){
                    let currentUser = runtime.getCurrentUser();
                    let userEmail = currentUser.email;
                    sAlert.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'You will receive an email with a csv shortly.'
                    });
                    let output = url.resolveScript({
                        deploymentId: schedulerLib.hmSchDef.deploymentID,
                        scriptId: schedulerLib.hmSchDef.scriptID,
                        params: {scriptName: 'getWarrantyGL', script_parameters: JSON.stringify({custscript_user_email: userEmail, custscript_start_date: startDate, custscript_end_date: endDate})}
                    });
                    https.get({
                        url: output
                    });
                }
                else{
                    sAlert.fire({
                        icon: 'warning',
                        title: 'Notice!',
                        text: 'The script is currently running wait a moment and try again.'
                    });
                }
            }
        }
        catch (e) {
            log.error({title: 'Critical error in getWarrantyGL', details: e});
        }
    }

    /**
     * Button Click For Get NO BOM
     */
    let getNoBom = () => {
        try{
            let scriptActive = schedulerLib.anotherDeploymentIsExecuting(schedulerLib.scripts.getNoBom.scriptId, schedulerLib.scripts.getNoBom.deploymentID);
            if(!scriptActive){
                let currentUser = runtime.getCurrentUser();
                let userEmail = currentUser.email;
                sAlert.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'You will receive an email with a csv shortly.'
                });
                let output = url.resolveScript({
                   deploymentId: schedulerLib.hmSchDef.deploymentID,
                   scriptId: schedulerLib.hmSchDef.scriptID,
                   params: {scriptName: 'getNoBom', script_parameters: JSON.stringify({custscript_email: userEmail})}
                });
                https.get({
                    url: output
                });
            }
            else{
                sAlert.fire({
                    icon: 'warning',
                    title: 'Notice!',
                    text: 'The script is currently running wait a moment and try again.'
                });
            }
        }
        catch (e) {
            log.error({title: 'Critical error in getNoBom', details: e});
        }
    }


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
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

    }

    return {
        getNoBom: getNoBom,
        getWarrantyGL: getWarrantyGL,
        setSpec: setSpec,
        bomObsolete: bomObsolete,
        openSOReport: openSOReport,
        //pageInit: pageInit,
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        //validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        //saveRecord: saveRecord
    };
    
});
