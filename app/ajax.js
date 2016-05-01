export class Ajax {
    constructor(base, errorCallback=null) {
	this.lastUrl = null;
	if (!base.endsWith("/"))
	    base += "/";
	this.base = base;
	this.errorCallback = errorCallback || this.ajaxError;
    }

    call(url, raw=false, type="GET", errorCallback=null) {
	this.lastUrl = this.base + url;
	
	return new Promise(((resolve, reject) => {
	    $.ajax({
		type,
		url: raw ? url : this.base + url,
		success: resolve,
		error: ((jqXHR, status, error) => {
		    let errorCallbacks = [
			errorCallback,
			this.errorCallback,
			this.ajaxError
		    ];

		    for (let cb of errorCallbacks) {
			if (cb && !cb.bind(this)(jqXHR, status, error)) {
			    break;
			}
		    }

		    reject(jqXHR, status, error);
		}).bind(this)
	    });
	}).bind(this));
    }

    ajaxError(jqXHR, status, error) {
	alert(`Ajax error retrieving ${this.lastUrl}. See window.jqXHR for more detail`);
	
	window._ajaxError = { jqXHR, status, error };
    }
}
