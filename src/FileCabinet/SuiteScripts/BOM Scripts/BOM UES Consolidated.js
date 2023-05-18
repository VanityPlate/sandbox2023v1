/**
 *
 * @copywrite Alex S. Ducken 2023 alexducken@gmail.com HydraMasterLLC
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record',
                'N/ui/serverWidget'],
    
    (record,
        sWidget) => {
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
                     let listToAdd = scriptContext.form.getSubList({sublistId: 'component'});
                     listToAdd.addField({id: 'quantityOnHand', label: 'On Hand', type: 'INTEGER'});
                }
                catch (e) {
                        log.error(e);
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

        }

        return {beforeLoad}

    });
