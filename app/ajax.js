export class Ajax {
    constructor(base, errorCallback=null) {
	this.lastUrl = null;
	if (base !== null && !base.endsWith("/"))
	    base += "/";
	this.base = base;
	this.errorCallback = errorCallback || this.ajaxError;
    }

    call(url, raw=false, type="GET", errorCallback=null) {
	this.lastUrl = this.base + url;
	
	return new Promise((resolve, reject) => {
	    $.ajax({
		type,
		url: raw || !this.base ? url : this.base + url,
		success: resolve,
		error: (jqXHR, status, error) => {
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
		}
	    });
	});
    }

    ajaxError(jqXHR, status, error) {
	alert(`Ajax error retrieving ${this.lastUrl}. See window._ajaxError for more detail`);
	
	window._ajaxError = { jqXHR, status, error };
    }
}
