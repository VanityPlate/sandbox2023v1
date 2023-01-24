/**
 *
 * @copyright Alex S. Ducken 2022 alexducken@gmail.com
 * HydraMaster LLC
 *
 * @update 1/24/2023 adding Get Monthly Open SO Report
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget'],
    
    (sW) => {

        /**
         * Render Form creates and returns a form to post to page
         * @return{Form}
         */
        let renderForm = () => {
            try{
                let form = sW.createForm({
                    title: 'HM Quick Tools'
                });
                form.clientScriptModulePath = './HM Quick Tools CS.js';
                form.addFieldGroup({
                   label: 'Information for Get Warranty GL',
                    id: 'custpage_group_gwgl'
                });
                form.addFieldGroup({
                   label: 'Required Fields for Set Spec',
                   id: 'custpage_set_spec'
                });
                form.addFieldGroup({
                   label: 'Required Field for Bom Obsolete',
                   id: 'custpage_group_bom_obso'
                });
                form.addButton({
                   id: 'custpage_getNoBom',
                   label: 'Get NO BOMS',
                   functionName: 'getNoBom'
                });
                form.addButton({
                   id: 'custpage_getwarrantygl',
                   label: 'Get Warranty GL',
                   functionName: 'getWarrantyGL'
                });
                form.addButton({
                   id: 'custpage_set_spec_button',
                   label: 'Set Spec',
                   functionName: 'setSpec'
                });
                form.addButton({
                   id: 'custpage_bom_obsolete',
                   label: 'Bom Obsolete',
                   functionName: 'bomObsolete'
                });
                form.addButton({
                   id: 'custpage_get_monthly',
                   label: 'Open SO Report',
                   functionName: 'openSOReport'
                });
                form.addField({
                    id: 'custpage_gwgl_start_date',
                    label: 'Search Start Date',
                    type: sW.FieldType.DATE,
                    container: 'custpage_group_gwgl'
                });
                form.addField({
                    id: 'custpage_gwgl_end_date',
                    label: 'Search End Date',
                    type: sW.FieldType.DATE,
                    container: 'custpage_group_gwgl'
                });
                form.addField({
                    id: 'custpage_spec' ,
                    label: 'Specification',
                    type: sW.FieldType.TEXT,
                    container: 'custpage_set_spec'
                });
                form.addField({
                    id: 'custpage_spec_item',
                    label: 'Item to Swap Specification',
                    type: sW.FieldType.TEXT,
                    container: 'custpage_set_spec'
                });
                form.addField({
                   id: 'custapge_item_to_obsolete',
                   label: 'Item to Obsolete',
                   type: sW.FieldType.SELECT,
                   container: 'custpage_group_bom_obso',
                    source: 'item'
                });
                return form;
            }
            catch (e) {
                log.error({title: 'Critical error in renderForm', details: e});
            }
        }

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
                    context.response.writePage({
                        pageObject: renderForm()
                    });
                }
            }
            catch (e) {
                log.error({title: 'Critical error in onRequest', details: e});
            }
        }

        return {onRequest}

    });
