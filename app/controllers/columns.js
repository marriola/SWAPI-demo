import { Controller } from "controllers/controller.js";
import { mapName } from "utils.js";
import { Ajax } from "ajax.js";
import { LocalStorage } from "local-storage.js";

export class ColumnsController extends Controller {
    constructor(base) {
	super(base);

	this.retrievedResources = 0;
	this.dragging = null;
	this.columnOrder = [];

	this.setupEventHandlers();
    }

    
    setupEventHandlers() {	
	$("#columnFilterExpand").on("click", e => {
	    let open = $("#expandIndicator").hasClass("open");
	    
	    if (open) {
		$("#expandIndicator").removeClass("open").addClass("closed");
		$("#columns").toggle(500);
	    } else {
		$("#expandIndicator").removeClass("closed").addClass("open");
		$("#columns").toggle(500);
	    }
	});	
    }

    
    /**
     * Retrieves the list of columns for each resource and generates the column filter
     */
    load(resources, after) {
	for (let resource of resources) {
	    this.ajax.call(`${resource.name}/schema`)
		.then((resource => { return response => {
		    resource.columns = Object.keys(response.properties).map((x, i) => {
			let out = mapName(x);
			out.show = true;
			out.hasUrl = response.properties[x].description.toLowerCase().contains("url");
			return out;
		    });

		    let defaultOrder = resource.columns.map(x => x.name);
		    let newOrder = LocalStorage.load("order." + resource.name);
		    if (newOrder) {
			resource.columns = this.reorder(resource.columns, defaultOrder, newOrder);
			this.columnOrder = newOrder;
		    } else {
			this.columnOrder = defaultOrder;
		    }
		    
		    if (++this.retrievedResources == resources.length) {
			this.viewmodel = new Vue({
			    el: "#columns",
			    data: { resources },
			    methods: {
				showColumns: this.showColumns
			    }
			});
			
			$("#please-wait").fadeOut(250, function() {
    			    this.setupDragAndDropEvents();
			    $("#controls").slideDown(250);
			}.bind(this));
			
			$("#btnGet").prop("disabled", false);
		    }
		} })(resource));
	}

	if (after)
	    after();
    }


    showColumns(resource) {
	$(".columnName").removeClass("selected");
	$(`.columnName[data-index='${resource.index}']`).addClass("selected");
	
	if ($(".columnPage:visible").length == 0) {
	    $(`.columnPage[data-index='${resource.index}']`).slideDown(250);
	} else {
	    $(".columnPage:visible").fadeOut(250, function() {
		$(`.columnPage[data-index='${resource.index}']`).fadeIn(250);
	    });
	}				
    }


    setupDragAndDropEvents() {
	$(".columnContainer label").on("dragstart", e => {
	    this.columnOrder = this.getColumnOrder();

	    this.dragging = e.originalEvent.target;
	    this.dragging.classList.add("dragging");
	    e.originalEvent.dataTransfer.setDragImage(document.createElement("img"), 0, 0);
	});
	
	$(".columnContainer").on("dragover", e => {
	    // Search up the DOM from our target for a <label> element whose parent has class columnContainer
	    
	    let target = e.originalEvent.target;
	    let parent = target.parentElement;
	    while (parent && !target.tagName === "LABEL") {
		target = parent;
		parent = target.parentElement;
	    }

	    if (parent.classList.contains("columnContainer")) {
		e.preventDefault();

		let halfHeight = target.clientHeight / 2;
		let above = e.offsetY < halfHeight;
		parent.insertBefore(this.dragging, above ? target : target.nextSibling);
	    }
	});

	$(".columnContainer label").on("drop", e => {
	    
	});

	$(".columnContainer label").on("dragend", e => {
	    this.dragging.classList.remove("dragging");
	    this.dragging = null;

	    let resource = this.getSelectedResource();
	    let oldOrder = this.columnOrder;
	    this.columnOrder = this.getColumnOrder();
	    resource.columns = this.reorder(resource.columns, oldOrder, this.columnOrder);
	    LocalStorage.save("order." + resource.name, this.columnOrder);
	});
    }


    getColumnOrder() {
	let $page = this.getSelectedPage();
	return Array.from($page.find("input")).map((elt, idx) => elt.getAttribute("name"));
    }
    

    getPage() {
	return parseInt($("#columnFilter .columnName.selected").attr("data-index"));
    }


    getSelectedPage() {
	let page = this.getPage();

	return $(`#columnFilter .columnPage[data-index='${page}']`);
    }
    

    getSelectedResource() {
	let page = this.getPage();
	
	return $VueDemo.default.resources.model.store[page];
    }
    
    reorder(columns, oldOrder, newOrder) {
	let indices = [];
	for (let col of newOrder) {
	    indices.push(oldOrder.indexOf(col));
	}

	let out = [];
	for (let i of indices) {
	    out.push(columns[i]);
	}

	return out;
    }
}
