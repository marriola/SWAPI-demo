//Vue.config.debug = true;
let $demo = (function () {
	String.prototype.contains = String.prototype.contains || function(needle) {
		return this.indexOf(needle) != -1;
	}

	const RESOLVE_LINKS = true;
	const SWAPI_BASE = "http://swapi.co/api/";
	const LINK_PLACEHOLDER = "";

	let ViewModels = {
		columns: null
	};

	const COMMON_METHODS = {
		/**
		 * Loads an entity into the entity popup
		 *
		 * @param column		The column containing the link
		 * @param url			The URL of the link
		 * @param event			The click event on the link
		 */
		clickLink: function (column, url, event) {
			event.preventDefault();
			event.target.classList.add("waiting");
			loadEntityPopup(url, () => {
				event.target.classList.remove("waiting");
			});
		},
		
		isArray: function(x) { return Array.isArray(x); }
	};

	let VueDemo = {
		waiting: {},
		linkStore: (localStorage.linkStore && JSON.parse(localStorage.linkStore)) || {},
		
		resourcesView: {
			selected: "0",	
		},
		
		resourcesViewMethods: {	
			selectResource: function(i) {
				$("#table").remove();
				$("#btnPrev, #btnNext").prop("disabled", true);
				VueDemo.page = 1;
			}
		},
		
		columnViewMethods: {
			showColumns: function(resource) {
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
		},
		
		entityViewMethods: {
			clickLink: COMMON_METHODS.clickLink,
			isArray: COMMON_METHODS.isArray,
			showOnMobile: function (name) {
				return name == "url";
			}
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


	///////////////////////////////////////////////////////////////////////////////////////////////
	// Helper functions
	///////////////////////////////////////////////////////////////////////////////////////////////

	
	function showOverlay() {
		$("#table-popup, #overlay").fadeIn();
	}


	function hideOverlay() {
		$("#table-popup, #overlay").fadeOut();
	}

	/**
	 * Returns a clone of a template element. If the element's ID ends in "-template", that portion is removed from the cloned element.
	 *
	 * @param $elt {JQuery}			The element to clone
	 * @param replace {Boolean}		True if the last cloned element with this ID should be removed
	 */
	function clone($elt, replace=false) {
		let id = $elt.attr("id").replace("-template", "");
		if (replace)
			$("#" + id).remove();
		return $elt.clone().first().attr("id", id);
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
			name: name,
			displayName: titleCase(name),
			index
		};
	}


	///////////////////////////////////////////////////////////////////////////////////////////////
	// Data functions
	///////////////////////////////////////////////////////////////////////////////////////////////

	
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
				url: SWAPI_BASE + resource.name + "/schema",
				error: function () { alert("error retrieving schema for '" + resource.name + "'"); },
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
						
						$("#please-wait").fadeOut(250, function() {
							$("#controls").fadeIn(250);
						});
						
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
		let url = SWAPI_BASE + resource.name + "/?page=" + page;
		$("#spinner").show();
		
		$.ajax({
			type: "GET",
			url: url,
			success: function (response) {
				$("#btnPrev").prop("disabled", !response.previous);
				$("#btnNext").prop("disabled", !response.next);
				
				$("#table").remove();
				$("#table-template").clone().first().attr("id", "table").show().appendTo($("#rest"));
			
				response.page = VueDemo.page;
				
				VueDemo.viewModel = new Vue({
					el: '#table',
					data: {
						pageStart: (VueDemo.page - 1) * 10 + 1,
						pageEnd: (VueDemo.page - 1) * 10 + response.results.length,
						count: response.count,
						resource: resource,
						results: response.results,
						linkStore: VueDemo.linkStore
					},
					methods: VueDemo.entityViewMethods
				});
				
				resolveLinks("#table");
				$("#spinner").hide();
				$("html, body").animate({ scrollTop: 0 });
				$("#table").show();
			},
			error: function(err) { debugger; }
		});
	}

	/**
	 * Retrieves entity data then populates and displays the div#table-popup element
	 */
	function loadEntityPopup(url, callback) {
		let resourceName;
		let match = url.match(/http:\/\/swapi.co\/api\/(\w+).*/);
		if (!match) {
			return;
		} else {
			resourceName = match[1];
		}
		
		let resource = VueDemo.resources.find(x => x.name == resourceName);
		if (!resource)
			return;
		
		let columns = resource.columns;
		
		$.ajax({
			type: "GET",
			url: url,
			success: function(result) {
				$("#rest").append(clone($("#table-popup-template"), true));
				
				new Vue({
					el: "#table-popup",
					data: {
						columns,
						result,
						linkStore: VueDemo.linkStore
					},
					methods: VueDemo.entityPopupViewMethods
				});

				resolveLinks("#table-popup");
				showOverlay();	
				if (callback)
					callback();
			}
		});
	}


	/**
	 * Retrieves the name of the item pointed to by each link with the not-set class, and sets its text.
	 *
	 * @param {string} selector		Optional. A selector for the element to search for links. If null, defauls to the entire document.
	 */
	function resolveLinks(selector=null) {
		if (!RESOLVE_LINKS)
			return;
		
		let $links = $(".not-set");
		let count = $links.length;
		
		console.log(`Resolving ${count} links...`);
		
		$links.each((idx, elt) => {
			let url = elt.getAttribute("href");
			
			if (VueDemo.waiting[url]) {
				--count;
				return;
			} else if (VueDemo.linkStore[url]) {
				$(`[href='${url}']`)
					.text(VueDemo.linkStore[url])
					.removeClass("not-set");
				--count;
				return;
			}
			
			VueDemo.waiting[url] = true;
			
			$.ajax({
				type: "GET",
				url: url,
				success: function(response) {
					let name = response.name || response.title;
					$(`[href='${url}']`)
						.text(name)
						.removeClass("not-set");
					VueDemo.linkStore[url] = name;
					
					--count;
					if (count == 0) {
						localStorage.linkStore = JSON.stringify(VueDemo.linkStore);
						console.log("Done.");
					}
				}
			});
		});
	}

	///////////////////////////////////////////////////////////////////////////////////////////////
	// Event handlers
	///////////////////////////////////////////////////////////////////////////////////////////////

	
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
			$("#columns").toggle(500);
		} else {
			$("#expandIndicator").removeClass("closed").addClass("open");
			$("#columns").toggle(500);
		}
	});

	
	$("#overlay, #btnClose").on("click", hideOverlay);

	
	///////////////////////////////////////////////////////////////////////////////////////////////

	
	getResources();
	
	return {
		hideOverlay
	};
})();