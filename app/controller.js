import { Ajax } from "ajax.js";

export class Controller {
    constructor(base) {
	this.SWAPI_BASE = base;

    	this.ajax = new Ajax(this.SWAPI_BASE);
    }
}
