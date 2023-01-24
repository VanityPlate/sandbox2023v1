/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message', 'N/currentRecord', 'N/search', 'N/https', 'N/url', 'SuiteScripts/Help_Scripts/schedulerLib.js'],

function(message, currentRecord, search, https, url, schedulerLib) {

    function pageInit(context){
    }

    /**
     * Definition - function for redirecting to suitlet showing results.
     */
    function displayResults(){
        var output = url.resolveScript({
            scriptId: 'customscript_wo_fix_scheduler',
            deploymentId: 'customdeploy_wo_fix_scheduler',
            params: {'results': 'workOrderFix'}
        });
        var response = https.get({
            url: output
        });
        var display = currentRecord.get();
        var content = response.body.split('^^^');
        var lines = Number(content[0]);
        if(lines != 0) {
            for (var x = 0; x < lines; x++) {
                var y = (x * 4) + 1;
                display.selectNewLine({sublistId: 'results'});
                display.setCurrentSublistValue({sublistId: 'results', fieldId: 'recordurl', value: content[y]});
                display.setCurrentSublistValue({sublistId: 'results', fieldId: 'itemname', value: content[y + 1]});
                display.setCurrentSublistValue({
                    sublistId: 'results',
                    fieldId: 'itemdescription',
                    value: content[y + 2]
                });
                display.setCurrentSublistValue({sublistId: 'results', fieldId: 'location', value: content[y + 3]});
                display.commitLine({sublistId: 'results'});
            }
            var myMsg = message.create({
                title: 'Success.',
                message: 'See results below.',
                type: message.Type.CONFIRMATION
            });
            myMsg.show({duration: 60000});
        }
        else{
            var myMsg = message.create({
                title: 'No results.',
                message: 'We were unable to find any items in need of cost rolling on this work order.',
                type: message.Type.INFORMATION
            });
            myMsg.show({duration: 60000});
        }
    }

    /**
     * Definition - Async function for checking on the status of the scheduled script.
     */
    function checkStatus(scriptID, attempts){
        var output = url.resolveScript({
            scriptId: 'customscript_wo_fix_scheduler',
            deploymentId: 'customdeploy_wo_fix_scheduler',
            params: {'requestStatus': scriptID}
        });
        var response = https.get({
            url: output
        });
        var status = response.body;

        if (status == 'COMPLETE') {
            displayResults();
        } else if (status == 'FAILED' || attempts > 17) {
            throw 'Scheduled Script Failed.';
        } else {
            setTimeout(function () {
                checkStatus(scriptID, ++attempts);
            }, 1000);
        }
    }

    /**
     * Definition - Function for displaying Error Message
     */
    function showError(){
        var myMsg = message.create({
            title: 'Failure to process Request',
            message: 'Sorry we could not find your work order. Please enter a correct WO; ie: "WO508"',
            type: message.Type.ERROR
        });
        myMsg.show({duration: 60000});
    }

    /**
     * Definition - Executes the logic looking for components that need to be cost rolled.
     */
    function findProblem(workid){
        //Creating promise
        var promiseWork = new Promise((resolve, reject) => {
            //Creating scheduled script and submitting
            var output = url.resolveScript({
                scriptId: 'customscript_wo_fix_scheduler',
                deploymentId: 'customdeploy_wo_fix_scheduler',
                params: {'custscript_wo_schedule_id' : workid}
            });
            var response = https.get({
               url: output
            });
            //Resolving scheduled script id
            var scriptID = response.body;

            resolve(scriptID);
        });

        //Executing Promise Chain
        promiseWork.then((output) => {
            checkStatus(output, 0);
        }).catch(function (reason) {
            var myMsg = message.create({
                title: 'Critical error!',
                message: 'There has been an unforeseen error. Contact your administrator. Error - ' + reason,
                type: message.Type.ERROR
            });
            myMsg.show({duration: 60000});
            log.error({title: 'Critical error', details: reason});
        });
    }

    function workOrderFix (){
        try{
            //Collecting Input
            var myRecord = currentRecord.get();
            var myWorkOrder = myRecord.getValue({fieldId: 'custpage_work_order'});

            //Validating Input
            var validateSearch = search.create({
                type: search.Type.TRANSACTION,
                filters:[["type","anyof","WorkOrd"], "AND", ["numbertext","haskeywords", myWorkOrder],"AND", ["mainline","is","T"]]
            });

            //Catching errors and gracefully failing. Asks user to re-enter information
            try {
                var validateResults = validateSearch.run().getRange({start: 0, end: 5});
            }
            catch(error){
                showError();
            }

            //Validation Success
            if(validateResults.length > 0) {
                //Telling user work is in progress
                var myMsg = message.create({
                    title: 'Processing Request',
                    message: 'Currently working on your request ' + myWorkOrder + ', please be patient.',
                    type: message.Type.INFORMATION
                });
                myMsg.show({duration: 60000});

                //Starting Work
                findProblem(validateResults[0].id);
            }
            //Validation Failure
            else{
                showError();
            }
        }
        catch(error){
            log.error({title: 'Critical error in workOrderFix', details: error});
        }
    }

    return {
        pageInit : pageInit,
        workOrderFix : workOrderFix
    };
    
});
