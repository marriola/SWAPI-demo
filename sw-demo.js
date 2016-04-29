//Vue.config.debug = true;
(function () {
String.prototype.contains = String.prototype.contains || function(needle) {
	return this.indexOf(needle) != -1;
}

function clone($elt, replace=false) {
	let id = $elt.attr("id").replace("-template", "");
	if (replace)
		$("#" + id).remove();
	return $elt.clone().first().attr("id", id);
}

const RESOLVE_LINKS = true;
const SWAPI_BASE = "http://swapi.co/api/";

let ViewModels = {
	columns: null
};

const COMMON_METHODS = {
	clickLink: function (column, url, event) {
		event.preventDefault();
		loadEntityPopup(url);
	},
	
	isArray: function(x) { return Array.isArray(x); }
};

let VueDemo = {
	linkStore: (localStorage["linkStore"] && JSON.parse(localStorage["linkStore"])) || {},
	
	resourcesView: {
		selected: "0",	
	},
	
	resourcesViewMethods: {	
		selectResource: function(i) {
			$("#entity").remove();
			$("#btnPrev, #btnNext").prop("disabled", true);
			VueDemo.page = 1;
		}
	},
	
	columnViewMethods: {
		showColumns: function(resource) {
			$(".columnName").removeClass("selected");
			$(`.columnName[data-index='${resource.index}']`).addClass("selected");
			
			$(".columnPage").hide();
			$(`.columnPage[data-index='${resource.index}']`).show();
		}
	},
	
	entityViewMethods: {
		clickLink: COMMON_METHODS.clickLink,
		isArray: COMMON_METHODS.isArray
	},
	
	entityPopupViewMethods: {
		clickLink: COMMON_METHODS.clickLink,
		isArray: COMMON_METHODS.isArray
	},
	
	resourceIndex: 0,
	viewModel: null,
	prevPage: null,
	nextPage: null,
	page: 1,
	resources: [],
	retrievedResources: 0
};


/**
 * Retrieves entity data then populates and displays the div#entity-popup element
 */
function loadEntityPopup(url) {
	let resourceName;
	let match = url.match(/http:\/\/swapi.co\/api\/(\w+).*/);
	if (!match) {
		return;
	} else {
		resourceName = match[1];
	}
	
	let resource = VueDemo.resources.find(x => x.originalName == resourceName);
	if (!resource)
		return;
	
	let columns = resource.columns;
	
	$.ajax({
		type: "GET",
		url: url,
		success: function(result) {
			$(document.body).append(clone($("#entity-popup-template"), true));
			
			new Vue({
				el: "#entity-popup",
				data: {
					columns,
					result,
					linkStore: VueDemo.linkStore
				},
				methods: VueDemo.entityPopupViewMethods
			});

			resolveLinks("#entity-popup");
			showOverlay();	
		}
	});
}


/**
 * Returns the resource currently selected by the select#resources element
 */
function getSelectedResource() {
	return VueDemo.resources[VueDemo.resourcesView.selected];
}


/**
 * Converts words separated by underscores to title case
 */
function titleCase(str) {
	return str.split("_")
		.map((x, i) => x[0].toUpperCase() + x.substr(1))
		.join(" ");
}


/**
 * Maps a name onto an object containing the original name, the title-cased name, and its index
 *
 * @param name {String}		The name of the item
 * @param index {Number}	The index of the item in its list (of resources or columns)
 *
 * @returns {Object}
 */
function mapName(name, index) {
	return {
		originalName: name,
		displayName: titleCase(name),
		index
	};
}


/**
 * Retrieves the list of available resources from the API, then gets columns for each when done
 */
function getResources() {
	$.ajax({
		type: "GET",
		url: SWAPI_BASE,
		success: function(response) {
			VueDemo.resources = Object.keys(response).map((x, i) => {
				let out = mapName(x, i);
				out.columns = [];
				out.selected = false;
				return out;
			});
			
			VueDemo.resourcesView.resources = VueDemo.resources;
			
			new Vue({
				el: "#resources",
				data: VueDemo.resourcesView,
				methods: VueDemo.resourcesViewMethods
			});
			
			getColumns();
		},
		error: function() { alert("couldn't get resources"); }
	});
}


/**
 * Retrieves the list of columns for each resource and generates the column filter
 */
function getColumns() {
	for (let resource of VueDemo.resources) {
		$.ajax({
			type: "GET",
			url: SWAPI_BASE + resource.originalName + "/schema",
			error: function () { alert("error retrieving schema for '" + resource.originalName + "'"); },
			success: function (resource) { return function (response) {
				resource.columns = Object.keys(response.properties).map((x, i) => {
					let out = mapName(x);
					out.show = true;
					out.hasUrl = response.properties[x].description.toLowerCase().contains("url");
					return out;
				});

				if (++VueDemo.retrievedResources == VueDemo.resources.length) {
					ViewModels.columns = new Vue({
						el: "#columns",
						data: { resources: VueDemo.resources },
						methods: VueDemo.columnViewMethods
					});
					$("#columnFilter").show();
					$("#btnGet").prop("disabled", false);
				}
			} }(resource)
		});
	}
}


/**
 * Loads and renders a page of entities
 *
 * @param page {number}		The page number to load
 */
function loadEntities(page="") {
	let resource = getSelectedResource();
	let url = SWAPI_BASE + resource.originalName + "/?page=" + page;
	
	$.ajax({
		type: "GET",
		url: url,
		success: function (response) {
			$("#btnPrev").prop("disabled", !response.previous);
			$("#btnNext").prop("disabled", !response.next);
			
			$("#entity").remove();
			$("#entity-template").clone().first().attr("id", "entity").show().appendTo($(document.body));
		
			response.page = VueDemo.page;
			
			VueDemo.viewModel = new Vue({
				el: '#entity',
				data: {
					page: VueDemo.page,
					count: response.count,
					resource: resource,
					results: response.results,
					linkStore: VueDemo.linkStore
				},
				methods: VueDemo.entityViewMethods
			});
			
			resolveLinks("#entity");			
			$("#entity").show();
		},
		error: function(err) { debugger; }
	});
}

/**
 * Replaces the dummy text in all links with the "fill-me-in" attributes
 *
 * @param {string} selector		Optional. A selector for the element to search for links. If null, defauls to the entire document.
 */
function resolveLinks(selector=null) {
	if (!RESOLVE_LINKS)
		return;
	
	function _resolveLink(link) {
		let url = link.getAttribute("href");
		if (VueDemo.linkStore[url]) {
			if (VueDemo.linkStore[url] !== "[click]") {
				$(`[href='${url}']`).text(VueDemo.linkStore[url]).removeAttr("fill-me-in");
				return;
			}
		}
		
		$.ajax({
			type: "GET",
			url: url,
			success: function(response) {
				let name = response.name || response.title;
				$(`[href='${url}']`).text(name).removeAttr("fill-me-in");
				VueDemo.linkStore[url] = name;
				
				let count = $("[fill-me-in]", selector).length;
				if (count == 0) {
					localStorage["linkStore"] = JSON.stringify(VueDemo.linkStore);
				}
			}
		});
	}

	$("[fill-me-in]", selector).each((idx, elt) => {
		let url = elt.getAttribute("href");
		if (!VueDemo.linkStore[url]) {
			VueDemo.linkStore[url] = "[click]"; // set dummy text so we don't try to get this name multiple times
		}
		_resolveLink(elt);
	});
}

function showOverlay() {
	$("#entity-popup, #overlay").fadeIn();
}

function hideOverlay() {
	$("#entity-popup, #overlay").fadeOut();
}

Vue.filter("getName", function(url) {
	return "[click]" || VueDemo.linkStore[url];
});

$("#btnPrev").on("click", e => {
	loadEntities(--VueDemo.page);
});

$("#btnGet").on("click", e => {
	loadEntities(VueDemo.page)
});

$("#btnNext").on("click", e => {
	loadEntities(++VueDemo.page)
});

$("#columnFilterExpand").on("click", e => {
	let open = $("#expandIndicator").hasClass("open");
	
	if (open) {
		$("#expandIndicator").removeClass("open").addClass("closed");
		$("#columns").slideUp();
	} else {
		$("#expandIndicator").removeClass("closed").addClass("open");
		$("#columns").slideDown();
	}
});

$("#overlay").on("click", hideOverlay);

getResources();
})();