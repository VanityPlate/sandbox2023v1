/**
 *
 * @copyright Alex S. Ducken 2022 alexducken@gmail.com
 * HydraMaster LLC
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'],
    
    (sWidget) => {
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
                        if(scriptContext.type == 'create'){
                                scriptContext.form.addButton({
                                        id: 'custpage_serial_button',
                                        label: 'Generate Serial(s)',
                                        functionName: 'fillSerialNumbers'
                                });
                                scriptContext.form.clientScriptModulePath = 'SuiteScripts/Assembly Builds/Assembly CS Consolidated.js';
                        }
                        else{
                                scriptContext.form.removeButton({
                                        id: 'custpage_serial_button'
                                });
                        }
                }
                catch (e) {
                      log.error({title: 'Critical error in scriptContext', details: e});
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

                }
                catch (e) {
                        log.error({title: 'Critical error in afterSubmit', details: e});
                }
        }

        return {beforeLoad}

    });
