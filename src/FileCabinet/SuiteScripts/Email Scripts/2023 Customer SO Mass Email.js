/**
 *
 * @copyright Alex S. Ducken 2022 alexducken@gmail.com
 * HydraMaster LLC
 *
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search',
                        'N/email',
                        'N/render',
                        'N/file',
                        'N/record'],
    
    (search,
                email,
                render,
                file,
                record) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
                try{
                        return {type: 'search', id: 'customsearch_atlas_items_on_bo_rpt_4'};
                }
                catch (e) {
                        log.error({title: 'Critical error in getInputData', details: e});
                }
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
                try{
                        mapContext.write({
                                key: JSON.parse(mapContext.value).values.entity.value,
                                value: mapContext.key
                        });
                }
                catch (e) {
                        log.error({title: 'Critical error in map', details: e});
                }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
                try{
                        //Refactor Testing
                        log.audit({title: reduceContext.key, details: reduceContext.values});
                        let salePDF = 1657830; //Production 1667904
                        //Function for creating files
                        let createFiles = (files, fileIds) => {
                                let template = file.load({id: salePDF});
                                let renderer = render.create();
                                renderer.templateContent = template.getContents();
                                for(const sale of fileIds.values()){
                                        //Refactor Testing
                                        log.audit({title: "Checking fileIds iteration", details: sale});
                                        renderer.addRecord({
                                                type: record.Type.SALES_ORDER,
                                                id: sale
                                        });
                                        files.push(renderer.renderAsPdf());
                                }
                        }


                        let subject = "2023 Pricing Updates";
                        let body = "Dear HydraMaster Customer,\n\n" +
                            "Attached are the updated sales orders with 2023 pricing.\n\n" +
                            "We at HydraMaster thank you for your patience as we continue to " +
                            "deal with ongoing issues in the supply chain.\n\n" +
                            "In 2022 we were forced to implement a surcharge on nearly our entire catalog. " +
                            "We recognize this complicates communication with your own customers around retail " +
                            "pricing. So, for 2023 we have updated our price book; this has resulted in significant " +
                            "increases throughout our catalog. We have made prior communications surrounding " +
                            "this forthcoming price increase (Reference: Distributor Pricing Communication " +
                            "sent by email on November 17th, 2022) . The crib notes are:\n\n" +
                            "The price increases are retroactive to all preexisting orders.\n" +
                            "The new prices will take effect January 1, 2023.\n" +
                            "We will remove surcharges from nearly all our products January 1, 2023.\n" +
                            "HydraMaster reserves the right to reintroduce surcharges in the face of " +
                            "rising material costs.\n\n" +
                            "If you have any questions, please contact your sales representative.";
                        let sender = 20582; //HydraMaster Sales
                        let fileMatrix = [new Set()];
                        let files = [];
                        let y = 0, z = 0;
                        //Split into groups of five SO
                        for(let x = 0; x < reduceContext.values.length; x++){
                                if(z == 5){
                                        z = 0; y++; fileMatrix[y] = new Set();
                                }
                                fileMatrix[y].add(reduceContext.values[x]); z++;
                        }
                        //Send out email(s) with no more than five transactions attached to each
                        for(let x = 0; x < fileMatrix.length; x++){
                                files = [];
                                createFiles(files, fileMatrix[x]);
                                email.send({
                                        author: sender,
                                        recipients: reduceContext.key,
                                        subject: subject,
                                        body: body,
                                        attachments: files
                                });
                        }
                }
                catch (e) {
                        log.error({title: 'Critical error in reduce', details: e});
                }
        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
                try{

                }
                catch (e) {
                        log.error({title: 'Critical error in summarize', details: e});
                }
        }

        return {getInputData, map, reduce}

    });
