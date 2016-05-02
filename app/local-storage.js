export class LocalStorage {
    static load(key) {
	let retrieved;

	if (localStorage) {
	    retrieved = localStorage[key];
	} else {
	    let m = document.cookie.match(`${key}=(.*?);`);
	    retrieved = m && m[1] || null;
	}

	return retrieved && JSON.parse(retrieved) || null;
    }

    static save(key, value) {
	let json = JSON.stringify(value);
	
	if (localStorage) {
	    localStorage[key] = json;
	} else {
	    document.cookie = `${key}=${json};`;
	}
    }
}
