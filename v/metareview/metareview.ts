import { metavisuo, attribute, database } from '../code/metavisuo.js';
import { mutall_error, svgns } from '../../../outlook/v/code/view.js';
import { exec } from '../../../schema/v/code/server.js';
//
//Define the type to hold the viewbox settings
type vb_settings = { pan_x: number; pan_y: number; zoom_x: number; zoom_y: number };
//
// A class to improve the review functionalities of metavisuo
export class metareview extends metavisuo {
    //
    //
    constructor() {
        //
        //Instantiate the parent class
        super();
    }
    public async show_panels(): Promise<void> {
        //
        //Carry out with showing pannels by the parent class
        await super.show_panels();
        //
        //Add all the comments and datatypes which are hidden by default
        this.add_metadata();
        //
        //Add the functionality to show/hide the datatypes
        this.get_element('data_types').onclick = () => this.toggle_metadata('data_type');
        //
        //Do a simmilar thing for the comments
        this.get_element('comments').onclick = () => this.toggle_metadata('comment');
    }
    //
    //Override the creation of a metavisuo database to handle the loading of the svg settings of a particular database
    async create_metadb(dbname: string): Promise<database> {
        //
        //Get the database that will be constructed from the parent class
        const dbase: database = await super.create_metadb(dbname);
        //
        //Now using the database load the svg
        return await this.load_settings(dbase);
    }
    //
    //Collect the viewbox settings of the particular database that is displayed
    //and update the svg to reflect the saved settings
    private async load_settings(dbase: database): Promise<database> {
        //
        //Query for getting the svg settings
        const sql: string = `SELECT 
            pan_x, 
            pan_y, 
            zoom_x, 
            zoom_y 
        FROM 
            dbase 
        WHERE 
            name = '${dbase.name}'`;
        //
        //Query the metavisuo dbase to get the data
        const rows: Array<vb_settings> = await exec(
            'database',
            ['metavisuo', false],
            'get_sql_data',
            [sql]
        );
        //
        //Ensure only one row was returnd
        if (rows.length > 1)
            throw new mutall_error(
                'One database cannot have multiple viewbox settings. Check you database'
            );
        //
        //Get the settings
        const setting: vb_settings = rows[0];
        //
        //Now load the settings to the svg
        dbase.proxy.setAttribute(
            'viewBox',
            `${[setting.pan_x, setting.pan_y, setting.zoom_x, setting.zoom_y]}`
        );
        //
        //Update the viewbox settings
        dbase.panx = setting.pan_x;
        dbase.pany = setting.pan_y;
        dbase.zoomx = setting.zoom_x;
        dbase.zoomy = setting.zoom_y;
        //
        //return the modified database
        return dbase;
    }
    //
    //This procedure is responsible for showing or  hiding the create_metadata of various attributes
    private toggle_metadata(selector: 'data_type' | 'comment'): void {
        //
        //Get all the containers identified by the given selector
        const texts: Array<Element> = Array.from(this.document.querySelectorAll('.' + selector));
        //
        //Iterate over the collection showing /hidding the create_metadata depending on the initial state
        texts.forEach((text) => text.classList.toggle('hidden'));
    }
    //
    //Get all the entities from the current dbase
    //And add the corresponding comments and data types for each of the attributes under the entities
    private add_metadata(): void {
        //
        //Ensure a dbase is present. If thats not the case alert the user
        if (!this.current_db) throw new mutall_error('Please select a database');
        //
        //For all entities do the following
        for (const key in this.current_db.entities) {
            //
            //Extract the particular entity from the collection
            const entity = this.current_db.entities[key];
            //
            //Go trough all attributes of an entity displaying the comments and the datatypes
            entity.attributes.forEach((attribute) => this.append_metadata(attribute));
        }
    }
    //
    //This method is to display additional infomation about an attribute
    //This may be a comment or the datatype to help programmers understand
    //how to work with data from the given attribute
    //The datatype will be separated using a ':' (Pascal notation) while the comment of the attribute will be demacated by a //
    //In the case of strings we also need to indicate the length of the string
    private append_metadata(attrib: attribute): void {
        //
        //Calculate the position along the horizontal axis
        const y: number = attrib.entity.position.y - attrib.entity.radius - 1 - 2 * attrib.index;
        //
        //The length of the attribut name
        const len: number = attrib.name.length;
        //
        //Xpos depending on the length of the attribute name determine the length of displacement to show the
        //data type or the comment next to the attribute
        const xpos: number = len < 5 ? 6 : len < 8 ? 8 : 10;
        //
        //Ensure a comment is present before displaying it
        if (attrib.comment) {
            //
            //Create a text element for showing the comment
            const comment: SVGTextElement = this.create_metadata(
                `// ${attrib.comment}`,
                { x: attrib.entity.position.x + xpos, y: y },
                'comment'
            );
            //
            //Append the comment to the page
            attrib.entity.component.attributes.margin.appendChild(comment);
        }
        //
        //The length of characters to be taken
        const length: string = attrib.data_type === 'varchar' ? `(${attrib.length})` : '';
        //
        //Ensure that  the attribute datatype is present before displaying
        if (attrib.data_type) {
            //
            //Create a text element to display the datatype
            const dtype: SVGTextElement = this.create_metadata(
                `:${attrib.data_type} ${length} `,
                { x: attrib.entity.position.x + xpos, y: y },
                'data_type'
            );
            //
            //Append the text element to the page
            attrib.entity.component.attributes.margin.appendChild(dtype);
        }
    }
    //
    //This method will display the given text content on a specified position in a svg text element
    //By default the svg text element is hidden and will only be visible when the relevant button is clicked
    //We also get an svg text element that we will further append to the relevant section
    private create_metadata(
        //
        //The acctual content to be shown within the text element
        content: string,
        //
        //Positioning of the text element in the svg viewbox
        position: { x: number; y: number },
        //
        //An identifier of what is to be shown i.e., 'comment' or 'data_type'
        type: string
    ): SVGTextElement {
        //
        //Create an element to hold the comment
        const element: SVGTextElement = this.document.createElementNS(svgns, 'text');
        //
        //Set the value of the comment
        element.textContent = content;
        //
        //Position the element
        element.setAttribute('y', String(position.y));
        element.setAttribute('x', String(position.x));
        //
        //hide the comment by default
        element.classList.add('hidden', type);
        //
        return element;
    }
}
