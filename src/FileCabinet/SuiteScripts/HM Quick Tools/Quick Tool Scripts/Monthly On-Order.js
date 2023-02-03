/**
 *
 * @copyright Alex S. Ducken 2023 alexducken@gmail.com
 * HydraMaster LLC
 *
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime',
                        'N/search',
                        'N/email',
                        'N/file'],
    
    (runtime,
                search,
                email,
                file) => {

        /**
         * Defines the function for generating the dates that open sales will measured against.
         * @param {Date} currentDate
         * @return {Array}
         */
        let getDates = (currentDate) => {
            try{
                let month = currentDate.getMonth();
                let year = currentDate.getFullYear();
                let dates = [];
                let setDate, dateString;
                for(let x = 23; x >= 0; x--){
                    setDate = new Date(year, month, 1);
                    dates.push({[setDate.toString()]: setDate.parse()});
                    month--;
                    if(month < 0){
                        year--;
                        month = 11;
                    }
                }
                return dates;
            }
            catch (e){
                log.error({title: "Critical error in getDates", details: e});
            }
        }


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
                        let script = runtime.getCurrentScript();
                        let userEmail = script.getParameter({name: 'custscript_user_email_monthly_so'});
                        //Refactor Testing
                        log.audit({title: 'TestFire and Email', details: userEmail});
                        //Refactor Testing
                        return search.create({
                                type: "salesorder",
                                filters:
                                    [
                                            ["type","anyof","SalesOrd"],
                                            "AND",
                                            ["amount","greaterthan","0.00"],
                                            "AND",
                                            ["datecreated","within","1/1/2020 12:00 am","1/31/2020 11:59 pm"],
                                            "AND",
                                            ["mainline","is","T"]
                                    ],
                                columns:
                                    [
                                            search.createColumn({name: "trandate", label: "Date"}),
                                            search.createColumn({name: "amount", label: "Amount"})
                                    ]
                        });
                }
                catch (e) {
                        log.audit({title: 'Critical error in getInputData', details: e});
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
                        //refactor testing
                        log.audit({title: mapContext.key, details: mapContext.value});
                        let results = search.create({
                                type: "invoice",
                                filters:
                                    [
                                            ["type","anyof","CustInvc"],
                                            "AND",
                                            ["createdfrom","anyof",mapContext.key],
                                            "AND",
                                            ["mainline","is","T"]
                                    ],
                                columns:
                                    [
                                            search.createColumn({name: "trandate", label: "Date"}),
                                            search.createColumn({name: "amount", label: "Amount"})
                                    ]
                        }).run().getRange({start: 0, end: 100});
                        //Refactor Testing
                        for(let x = 0; x < results.length; x++){

                        }
                }
                catch (e) {
                        log.audit({title: 'Critical error in mapContext', details: e});
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

                }
                catch (e) {
                        log.audit({title: 'Critical error in reduceContext', details: e});
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
                    let dates = getDates(new Date());
                    //Refactor Testing
                    log.audit({title: 'Testing Dates,', details: dates});
                }
                catch (e) {
                        log.audit({title: 'Critical error in summaryContext', details: e});
                }
        }

        //Refactor Testing
        return {getInputData, reduce, summarize}

    });