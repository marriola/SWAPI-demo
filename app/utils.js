Array.from = Array.from || function(o) {
    let out = [];
    for (let i = 0; i < o.length; i++) {
	out.push(o[i]);
    }
    return out;
}

String.prototype.endsWith = String.prototype.endsWith || function(ch) {
    return this[this.length - 1] === ch;
}

String.prototype.contains = String.prototype.contains || function(needle) {
    return this.indexOf(needle) != -1;
}


/**
 * Converts words separated by underscores to title case
 */
export function titleCase(str) {
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
export function mapName(name, index) {
    return {
	name: name,
	displayName: titleCase(name),
	index
    };
}


/**
 * Returns a clone of a template element. If the element's ID ends in "-template", that portion is removed from the cloned element.
 *
 * @param $elt {JQuery}			The element to clone
 * @param replace {Boolean}		True if the last cloned element with this ID should be removed
 */
export function clone($elt, replace=false) {
    let id = $elt.attr("id").replace("-template", "");
    if (replace)
	$("#" + id).remove();
    return $elt.clone().first().attr("id", id);
}
