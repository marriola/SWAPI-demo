"use strict";

//Vue.config.debug = true;

String.prototype.contains = String.prototype.contains || function (needle) {
	return this.indexOf(needle) != -1;
};

function clone($elt) {
	var replace = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

	var id = $elt.attr("id").replace("-template", "");
	if (replace) $("#" + id).remove();
	return $elt.clone().first().attr("id", id);
}

var RESOLVE_LINKS = true;
var SWAPI_BASE = "http://swapi.co/api/";

var ViewModels = {
	columns: null
};

var COMMON_METHODS = {
	clickLink: function clickLink(column, url, event) {
		event.preventDefault();
		loadEntityPopup(url);
	},

	isArray: function isArray(x) {
		return Array.isArray(x);
	}
};

var VueDemo = {
	linkStore: localStorage["linkStore"] && JSON.parse(localStorage["linkStore"]) || {},

	resourcesView: {
		selected: "0"
	},

	resourcesViewMethods: {
		selectResource: function selectResource(i) {
			$("#entity").remove();
			$("#btnPrev, #btnNext").prop("disabled", true);
			VueDemo.page = 1;
		}
	},

	columnViewMethods: {
		showColumns: function showColumns(resource) {
			$(".columnName").removeClass("selected");
			$(".columnName[data-index='" + resource.index + "']").addClass("selected");

			$(".columnPage").hide();
			$(".columnPage[data-index='" + resource.index + "']").show();
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
	var resourceName = void 0;
	var match = url.match(/http:\/\/swapi.co\/api\/(\w+).*/);
	if (!match) {
		return;
	} else {
		resourceName = match[1];
	}

	var resource = VueDemo.resources.find(function (x) {
		return x.originalName == resourceName;
	});
	if (!resource) return;

	var columns = resource.columns;

	$.ajax({
		type: "GET",
		url: url,
		success: function success(result) {
			$(document.body).append(clone($("#entity-popup-template"), true));

			new Vue({
				el: "#entity-popup",
				data: {
					columns: columns,
					result: result,
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
	return str.split("_").map(function (x, i) {
		return x[0].toUpperCase() + x.substr(1);
	}).join(" ");
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
		index: index
	};
}

/**
 * Retrieves the list of available resources from the API, then gets columns for each when done
 */
function getResources() {
	$.ajax({
		type: "GET",
		url: SWAPI_BASE,
		success: function success(response) {
			VueDemo.resources = Object.keys(response).map(function (x, i) {
				var out = mapName(x, i);
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
		error: function error() {
			alert("couldn't get resources");
		}
	});
}

/**
 * Retrieves the list of columns for each resource and generates the column filter
 */
function getColumns() {
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		var _loop = function _loop() {
			var resource = _step.value;

			$.ajax({
				type: "GET",
				url: SWAPI_BASE + resource.originalName + "/schema",
				error: function error() {
					alert("error retrieving schema for '" + resource.originalName + "'");
				},
				success: function (resource) {
					return function (response) {
						resource.columns = Object.keys(response.properties).map(function (x, i) {
							var out = mapName(x);
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
					};
				}(resource)
			});
		};

		for (var _iterator = VueDemo.resources[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			_loop();
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}
}

/**
 * Loads and renders a page of entities
 *
 * @param page {number}		The page number to load
 */
function loadEntities() {
	var page = arguments.length <= 0 || arguments[0] === undefined ? "" : arguments[0];

	var resource = getSelectedResource();
	var url = SWAPI_BASE + resource.originalName + "/?page=" + page;

	$.ajax({
		type: "GET",
		url: url,
		success: function success(response) {
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
		error: function error(err) {
			debugger;
		}
	});
}

/**
 * Replaces the dummy text in all links with the "fill-me-in" attributes
 *
 * @param {string} selector		Optional. A selector for the element to search for links. If null, defauls to the entire document.
 */
function resolveLinks() {
	var selector = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

	if (!RESOLVE_LINKS) return;

	function _resolveLink(link) {
		var url = link.getAttribute("href");
		if (VueDemo.linkStore[url]) {
			if (VueDemo.linkStore[url] !== "[click]") {
				$("[href='" + url + "']").text(VueDemo.linkStore[url]).removeAttr("fill-me-in");
				return;
			}
		}

		$.ajax({
			type: "GET",
			url: url,
			success: function success(response) {
				var name = response.name || response.title;
				$("[href='" + url + "']").text(name).removeAttr("fill-me-in");
				VueDemo.linkStore[url] = name;

				var count = $("[fill-me-in]", selector).length;
				if (count == 0) {
					localStorage["linkStore"] = JSON.stringify(VueDemo.linkStore);
				}
			}
		});
	}

	$("[fill-me-in]", selector).each(function (idx, elt) {
		var url = elt.getAttribute("href");
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

Vue.filter("getName", function (url) {
	return "[click]" || VueDemo.linkStore[url];
});

$("#btnPrev").on("click", function (e) {
	loadEntities(--VueDemo.page);
});

$("#btnGet").on("click", function (e) {
	loadEntities(VueDemo.page);
});

$("#btnNext").on("click", function (e) {
	loadEntities(++VueDemo.page);
});

$("#columnFilterExpand").on("click", function (e) {
	var open = $("#expandIndicator").hasClass("open");

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