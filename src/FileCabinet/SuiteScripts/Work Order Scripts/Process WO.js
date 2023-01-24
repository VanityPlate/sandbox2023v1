/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/file', 'SuiteScripts/Help_Scripts/Load_Unknown_Record_Type.js'],

function(record, search, runtime, file, loadUnknown) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
        try {
            //Retrieving work order id and loading record
            var workOrderId = runtime.getCurrentScript().getParameter({name: 'custscript_wo_id'});
            var workOrder = record.load({
                type: record.Type.WORK_ORDER,
                id: workOrderId,
                isDynamic: false
            });

            //Find location to check for against cost rolling
            var location = workOrder.getValue({fieldId: 'location'});
            var locationText = workOrder.getText({fieldId: 'location'});


            //Load file to write results too
            var outputFile = file.create({
                name: 'workOrderFix.txt',
                fileType: file.Type.PLAINTEXT,
                folder: 264120,
                isOnline: true
            });

            //Iterate through workOrder members and and find ones in need of cost rolling
            //adding these to the file
            var listLength = workOrder.getLineCount({sublistId: 'item'});
            for (var x = 0; x < listLength; x++) {
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        [
                            ["internalid","anyof",workOrder.getSublistValue({sublistId: 'item', fieldId: 'item', line: x})],
                            "AND",
                            ["inventorylocation.internalid","anyof",location]
                        ],
                    columns:
                        [
                            search.createColumn({name: "itemid", label: "Name"}),
                            search.createColumn({name: "locationcostaccountingstatus", label: "Location Cost Accounting Status"}),
                            search.createColumn({name: "salesdescription", label: "Description"}),
                        ]
                }).run().getRange({start: 0, end: 1});

                if(itemSearchObj[0] && itemSearchObj[0].recordType != record.Type.SERVICE_ITEM) {

                    var costStatus = itemSearchObj[0].getValue({name: 'locationcostaccountingstatus'});

                    if (!costStatus || costStatus != 'Complete') {
                        var nextLine = 'https://5429364-sb1.app.netsuite.com/app/common/item/item.nl?id=' + itemSearchObj[0].id.toString() + '^^^' +
                            itemSearchObj[0].getValue({name: 'itemid'}).toString() + '^^^' +
                            itemSearchObj[0].getValue({name: 'salesdescription'}).toString() + '^^^' +
                            locationText;

                        outputFile.appendLine({value: nextLine});
                    }
                }
            }
            outputFile.save();
        }
        catch(error){
            log.error({title: 'Critical error in execute', details: error});
        }
    }

    return {
        execute: execute
    };
    
});
