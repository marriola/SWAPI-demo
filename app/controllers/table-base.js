import { Controller } from "controllers/controller.js";

export class TableBaseController extends Controller {
    constructor(base, resources, linkStore, linkResolver) {
	super(base);
	this.resources = resources;
	this.linkStore = linkStore;
	this.linkResolver = linkResolver;
    }
}
