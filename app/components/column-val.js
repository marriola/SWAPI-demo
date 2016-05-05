let ColumnValueComponent = Vue.extend({
    props: ["value", "hasUrl", "linkStore"],
    
    template: "#entity-col-template",

    methods: {
	sanitize: function(x) {
	    return x || "[none]";
	},

	isArray: function(x) {
	    return Array.isArray(x);
	},

	/**
	 * Loads an entity into the entity popup
	 *
	 * @param url			The URL of the link
	 * @param event			The click event on the link
	 */
	clickLink: function(url, event) {
	    event.preventDefault();
	    event.target.classList.add("waiting");
	    $VueDemo.default.tablePopup.load(url, () => {
		event.target.classList.remove("waiting");
	    });
	}
    }
});

export { ColumnValueComponent };
