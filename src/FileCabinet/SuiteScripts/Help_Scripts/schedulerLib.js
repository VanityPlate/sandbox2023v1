define(['N/https', 'N/url'],

function(https, url) {

    /**
     * Constants
     */

    /**
     *List alternate deployments for a script to schedule multiple concurrent executions
     */
    const ALTDEPLOYMENTS = {
        altRegisterWarranty: ['customdeploy_manual_warranty_ss', 'customdeploy_manual_warranty_ss_2', 'customdeploy_manual_warranty_ss_3', 'customdeploy_manual_warranty_ss_4',
            'customdeploy_manual_warranty_ss_5', 'customdeploy_manual_warranty_ss_6', 'customdeploy_manual_warranty_ss_7', 'customdeploy_manual_warranty_ss_8',
            'customdeploy_manual_warranty_ss_9', 'customdeploy_manual_warranty_ss_10']
    };

    const FILELIB = {workOrderFix: 'Process_Files/Script Files/workOrderFix.txt', countKPI: 'Process_Files/Script Files/countKPI.txt'};
    //Include ScriptId, DeploymentId, Results_File_Path
    const SCRIPTS = {
        updateAssemblySubs : {scriptId: 'customscript_update_assembly_subs', deploymentID: 'customdeploy_update_assembly_subs', taskType: 'MAP_REDUCE', altDeployments: false},
        updateItemSupplyCat : {scriptId: 'customscript_set_item_cat_mr', deploymentID: 'customdeploy_set_item_cat_mr', taskType: 'MAP_REDUCE', altDeployments: false},
        manualCommitUpdate : {scriptId: 'customscript_manual_commit_update_so', deploymentID: 'customdeploy_manual_commit_update_so', taskType: 'MAP_REDUCE', altDeployments: false},
        manualItemArrival: {scriptId: 'customscript_manual_item_arrival', deploymentID: 'customdeploy_manual_item_arrival', taskType: 'SCHEDULED_SCRIPT', altDeployments: false},
        getNoBom: {scriptId: 'customscript_get_no_bom', deploymentID: 'customdeploy_get_no_bom', taskType: 'MAP_REDUCE', altDeployments: false},
        getWarrantyGL: {scriptId: 'customscript_get_warranty_gl', deploymentID: 'customdeploy_get_warranty_gl', taskType: 'MAP_REDUCE', altDeployments: false},
        updateBom: {scriptId: 'customscript_mr_bom_update', deploymentID: 'customdeploy_mr_bom_update', taskType: 'MAP_REDUCE', altDeployments: false},
        bomObsolete: {scriptId: 'customscript_bom_obsolete_v2', deploymentID: 'customdeploy_bom_obsolete_v2', taskType: 'MAP_REDUCE', altDeployments: false},
        registerWarranty : {scriptId: 'customscript_manual_warranty_ss', deploymentID: null, taskType: 'SCHEDULED_SCRIPT', altDeployments: ALTDEPLOYMENTS.altRegisterWarranty},
        monthlyOnOrder : {scriptId: 'customscript_monthly_on_order', deploymentID: 'customdeploy_monthly_on_order', taskType: 'MAP_REDUCE', altDeployments: false},
    };

    const HM_SCHEDULER_DEFINITIONS = {scriptID: 'customscript_hm_scheduler', deploymentID: 'customdeploy_hm_scheduler'};
    const HM_CHECK_STATUS ={scriptId: 'customscript_check_s_status', deploymentID: 'customdeploy_check_s_status'};

    /**
     * Searches for a currently executing script and returns true if one is found false if otherwise
     * @param {string} scriptId
     * @param {string} deploymentId
     * @return {boolean}
     */
    let anotherDeploymentIsExecuting = (scriptId, deploymentId, extend= false) => {
        //Refactor Testing
        log.audit({title: scriptId, details: deploymentId});
        let output = url.resolveScript({
            scriptId: HM_CHECK_STATUS.scriptId,
            deploymentId: HM_CHECK_STATUS.deploymentID,
            params: {scriptID : scriptId, scriptDeployID: deploymentId},
            returnExternalUrl: extend
        });
        //Refactor Testing
        output = https.get({
            url: output
        });
        let returnOut = output.body == 'true' ? true : false;
        return (returnOut);
    };

    return {
        hmSchDef: HM_SCHEDULER_DEFINITIONS,
        scripts: SCRIPTS,
        fileLib: FILELIB,
        hmCheckStatus: HM_CHECK_STATUS,
        anotherDeploymentIsExecuting: anotherDeploymentIsExecuting,
    };
    
});
