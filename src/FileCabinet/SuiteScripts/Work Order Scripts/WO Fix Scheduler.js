/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/task', 'N/file', 'SuiteScripts/Help_Scripts/schedulerLib.js'],

function(task, file, schedulerLib) {

    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        if(context.request.method === 'GET') {
            try {
                //Retrieving work order id
                var workid = context.request.parameters['custscript_wo_schedule_id'];
                var requestStatus = context.request.parameters['requestStatus'];
                var results = context.request.parameters['results'];
                var countKPI = context.request.parameters['countKPI'];

                if(results){
                    var content = file.load({
                        id: schedulerLib.fileLib[results]
                    });
                    var iterator = content.lines.iterator();
                    var output = '';
                    var lines = 0;
                    iterator.each(function (line) {
                        output = output + '^^^' + line.value;
                        lines++;
                        return true;
                    });
                    context.response.write({output: lines + output});
                }
                else if(requestStatus){
                    var taskStatus = task.checkStatus({taskId: requestStatus});

                    context.response.write({output: taskStatus.status});
                }
                else if(workid) {
                    //Scheduling Script
                    var workTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
                    workTask.scriptId = 'customscript_process_wo_fix';
                    workTask.deploymentId = 'customdeploy_process_wo_fix';
                    workTask.params = {'custscript_wo_id': workid};
                    var scriptid = workTask.submit();

                    context.response.write({output: scriptid});
                }
                else if(countKPI){
                    //Scheduling Script
                    var countKPI = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
                    countKPI.scriptId = 'customscript_count_kpi_ss';
                    countKPI.deploymentId = 'customdeploy_count_kpi_ss';
                    var scriptid = countKPI.submit();

                    context.response.write({output: scriptid});
                }
                else{
                    throw 'Invalid parameters, WO Fix Scheduler.js, onRequest()';
                }
            }
            catch(error){
                log.error({title: 'Critical error in onRequest', details: error});
            }
        }
    }

    return {
        onRequest: onRequest
    };
    
});
