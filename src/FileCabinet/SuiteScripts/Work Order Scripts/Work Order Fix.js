/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget'],

function(serverWidget) {

    /**
     * Creates and returns a form object
     */
    function renderForm(){
        var form = serverWidget.createForm({
            title: 'HM Work Order - Find components in need of cost rolling.'
        });

        form.clientScriptModulePath = 'SuiteScripts/Work Order Scripts/WO Fix Client S.js';

        form.addButton({
            id: 'fire',
            label: 'Submit',
            functionName: 'workOrderFix'
        });

        form.addField({
           id: 'custpage_work_order',
           type: serverWidget.FieldType.TEXT,
           label: 'Work Order'
        });

        var results = form.addSublist({
           id: 'results',
           type: serverWidget.SublistType.INLINEEDITOR,
           label: 'Results'
        });
        var urlField = results.addField({
            id: 'recordurl',
            type: serverWidget.FieldType.URL,
            label: 'View'
        });
        urlField.linkText = 'View';
        results.addField({
            id: 'itemname',
            type: serverWidget.FieldType.TEXT,
            label: 'Item'
        });
        results.addField({
            id: 'itemdescription',
            type: serverWidget.FieldType.TEXT,
            label: 'Description'
        });
        results.addField({
            id: 'location',
            type: serverWidget.FieldType.TEXT,
            label: 'Location'
        });

        return form;
    }

    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        try {
            if (context.request.method === "GET") {
                    context.response.writePage({
                        pageObject: renderForm()
                    });
            }
        }
        catch(error){
            log.error({title: 'Critical Error in onRequest', details: error});
        }
    }

    return {
        onRequest: onRequest
    };
    
});
