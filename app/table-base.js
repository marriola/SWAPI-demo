import { Controller } from "controller.js"

export class TableBaseController extends Controller {
    constructor(base, linkStore, linkResolver) {
	super(base);
	this.linkStore = linkStore;
	this.linkResolver = linkResolver;
    }

    /**
     * Loads an entity into the entity popup
     *
     * @param column		The column containing the link
     * @param url			The URL of the link
     * @param event			The click event on the link
     */
    clickLink (column, url, event) {
	event.preventDefault();
	event.target.classList.add("waiting");
	$VueDemo.default.loadEntityPopup(url, () => {
	    event.target.classList.remove("waiting");
	});
    }
    
    isArray(x) {
	return Array.isArray(x);
    }
}
