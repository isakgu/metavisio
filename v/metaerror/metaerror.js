import { metavisuo } from "../code/metavisuo.js";
import { myalert } from "../../../outlook/v/code/view.js";
import { mutall_error } from "../../../schema/v/code/schema.js";
//
// A class for handling errors (in a database project) in a visual way
export class metaerror extends metavisuo {
    //
    //
    static maximum_name_size = 12;
    constructor() {
        super();
    }
    //
    //Display the errors that are in the current selected entity
    show_errors() {
        //
        // Get the selected entity
        const entity = this.get_selected_entity();
        //
        //Get the error report
        const report = this.get_report(entity);
        //
        //Show the report
        myalert(report);
    }
    //Check current database for errors (to support metavisuo). This means 2 
    //things:-
    //-Identify new errors beyond those identifiid in PHP
    //-Highlight the schema objects that have errors;
    async create_metadb(dbname) {
        //
        //Call the super version of this method
        const dbase = await super.create_metadb(dbname);
        //
        //This is teh extemsion of the super method
        //
        //For each entity in the database check for name size eror.
        //Use a for-in-loop to iterate over all the keys od entitiesy;
        for (const ename in dbase.entities) {
            //
            //Get the named entity
            const entity = dbase.entities[ename];
            //
            //Add the name size error to the entity
            this.add_name_size_error(entity);
            //
            //If there are errors in this  entity mark it as such
            if (entity.errors.length > 0)
                entity.proxy.classList.add('error');
        }
        return dbase;
    }
    //Get the error report from the currenty selected entity in this
    //metavisuo appliction
    get_report(entity) {
        //
        // Get the entity errors
        const myerrors = entity.errors;
        //
        // If there is no error return with appropriate message
        if (myerrors.length === 0)
            return "No errors found.";
        //
        //Compile the errors in a detail/summary arrangement, separated by line breaks
        const report = myerrors.map(error => `
        <details>
            <summary>${error.message}</summary>
            ${error.stack}
        </details>
    `).join("<br/>");
        //
        // Return the report of errors
        return report;
    }
    //
    // Get the selected entity
    get_selected_entity() {
        //
        // Get the current database
        const database = this.current_db;
        //
        //If there is none, abort this procedure and alert the user
        if (!database)
            throw new mutall_error('Please select a database');
        //
        // Get the entities in the datanase
        const entities = database.entities;
        //
        //Get teh selected entity element
        const element = this.document.querySelector('.selected');
        //
        //Abort this process if there is no selection
        if (!element)
            throw new mutall_error('Please select an entity');
        //
        //The selected entity has an id tha matches the entity name
        const ename = element.id;
        //
        // Get the named entity entity
        const entity = entities[ename];
        //
        //If no such name entoty is found, alert the user
        if (!entity)
            throw new mutall_error(`No entity is found by id '${ename}'`);
        //
        return entity;
    }
    //Check the size of the entity name and report an error if it is longer than 
    //maximum_name_size. Why 12? It is the length of the word contribution which
    //is about the longest name we should allow, the shorter the better.
    add_name_size_error(entity) {
        //
        //Determine the size of the name attribute
        const size = entity.name.length;
        //
        //If the size is greater than maximum_name_size, we add the error to those 
        //of this entity
        if (size <= metaerror.maximum_name_size)
            return;
        //
        //At this point the size is greater than 12.Compile and save the error
        const error = new Error(`Entity name size is '${size}' characters which is longer than 10`);
        //
        //Save the error
        entity.errors.push(error);
    }
}
