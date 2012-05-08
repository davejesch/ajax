// commonly used Ajax class, Hg

function Hg()
{
	// if global 'hgdata' exists, use settings from it
	if (typeof(hgdata) != "undefined")
	{
		this.defaultUrl = hgdata.ajaxurl;
		this.userId = parseInt(hgdata.userid);
	}
}

Hg.prototype =
{
	error: false,						// true if error occured
	errorText: "",						// error message
	errorStatus: "",					// error status
	callback: null,						// callback function for successful requests
	trnComplete: 0,						// set to 1 when ajax call has completed
	errorCallback: null,				// callback function for error requests
	validationErrors: new Array(),		// validation error information
	url: "",							// url to send request to
	ret: 0,								// return value
	timeout: 0,							// timeout for request
	enableValidation: 1,				// 1 = enabled, 0 = disabled
	formElementType: "td",				// DOM element that wraps form elements (the <input> element)
	async: true,						// when true, do asynchronous calls
	defaultUrl: null,					// default server side script to connect to
	userId: null,						// user id


	// initialize error and callback information
	initHg: function(ajaxCallback, sUrl)
	{
		this.error = false;
		this.errorText = "";
		this.errorStatus = "";
		this.callback = ajaxCallback;
		this.trnComplete = 0;
		this.errorCallback = null;
		if (typeof(sUrl) == "undefined" || sUrl == null)
			this.url = $Hg.defaultUrl;
		else
			this.url = sUrl;
		this.timeout = 0;
		this.enableValidation = 1;
		this.async = true;
	},

	// default callback method for all Hg Ajax functions
	hgCallback: function(jsonData)
	{
		this.trnComplete = 1;
		if (jsonData == null)
			return;

		// the following sections assume certain data values are set within the
		// json data. Use the AjaxResponse class to create these.

		// check for '.session_timeout' and go to login page
		try
		{
			if (typeof(jsonData.session_timeout) != "undefined")
			{
				// TODO: display modal dialog to allow user to re-authenticate
				window.location = "/wp-login.php?redirect_to=" + location.href;
			}
		} catch (e) { }

		// check for setting focus
		if (typeof(jsonData.focus) != "undefined" && jsonData.focus != null)
		{
			// look for <input id=>
			if (document.getElementById(jsonData.focus) != null)
				document.getElementById(jsonData.focus).focus();
			else
			{
				// for for <form id=><input name=>
				var sel = "#" + jsonData.form + ' [name="' + jsonData.focus + '"]';
				jQuery(sel).focus();
			}
		}

		// check for messages
		try
		{
			// look for '.errors' and display them
			if (typeof(jsonData.errors) != "undefined")
			{
				var errorMsg = "";
				if (jsonData.errors.length > 0)
				{
					for (x = 0; x < jsonData.errors.length; x++)
					{
						if (typeof(jsonData.errors[x]["error"]) != "undefined")
							errorMsg += "<p>" + jsonData.errors[x]["error"] + "</p>";
					}

					// TODO: display in a dialog
					if (errorMsg != "")
						alert(errorMsg);
				}
			}

			// look for '.notices' and display them
			if (typeof(jsonData.notices) != "undefined")
			{
				var noticeMsg = "";
				if (jsonData.notices.length > 0)
				{
					for (x = 0; x < jsonData.notices.length; x++)
					{
						if (typeof(jsonData.notices[x]["message"]) != "undefined")
							noticeMsg += jsonData.notices[x]["message"] + "\n";
					}

					// TODO: display in a dialog
					if (noticeMsg != "")
						alert(noticeMsg);
				}
			}
		} catch (e) { }

		// check result for validation errors
		if (typeof(jsonData.success) != "undefined" && jsonData.success == 1 &&
			typeof(jsonData.form) != "undefined" && jsonData.form != "")
		{
			// no errors, clear any previos error messages
			this.clearValidation(jsonData.form);
		}

		// markup DOM with validation errors
		try
		{
			if (this.enableValidation)
			{
				if (typeof(jsonData.validation) != "undefined" &&
					typeof(jsonData.form) != "undefined" && jsonData.form != "")
				{
					if (jsonData.validation.length > 0)
					{
						// clear the errors for this form:
						this.clearValidation(jsonData.form);

						// add a class to the form for displaying messages
						var form = jQuery("#" + jsonData.form);
						jQuery(form).addClass("validation-errors");

						// apply validation error messages to elements in the form:
						for (x = 0; x < jsonData.validation.length; x++)
						{
							var fieldName = jQuery('[name="' + jsonData.validation[x].fieldName + '"]');
							jQuery(fieldName).addClass("validation-error");

							// find the closes wrapping element, then append error message
							var fieldParent = fieldName.closest(this.formElementType);
							fieldParent.append('<div class="validation-msg">' + jsonData.validation[x].errorMessage  + "</div>");
						}
					}
				}
			}
		} catch (e) { }

		// if there is a callback function, call it
		if (typeof(this.callback) == "function")
		{
			try
			{
				this.callback(jsonData);
			} catch (e) { }
		}
	},

	// remove any validation messages within <form id=> DOM
	clearValidation: function(form)
	{
		form = jQuery("#" + form);

		jQuery(form).find("div.validation-msg").each (function() { jQuery(this).remove(); });
		jQuery(form).find("input, select, textarea").each (function() { jQuery(this).removeClass("validation-error"); });
		jQuery(form).find(this.formElementType + ".errorItem").each (function() { jQuery(this).removeClass("errorItem"); });
	},

	// perform ajax get operation
	get: function(target_url, data, success_callback, datatype)
	{
		var inst = new Hg();					// create a new Hg instance

		// setting a custom timeout
		var timeout = this.timeout;
		inst.async = this.async;

		inst.initHg(success_callback, target_url);
		if (typeof(datatype) == "undefined" || datatype == "")
			datatype = "json";

		inst.ret = jQuery.get(inst.url, data, function(data)
		{
			inst.hgCallback(data)
		}, datatype, { timeout: timeout },
		{ async: inst.async } );

		return (inst);
	},

	// perform ajax get, forcing content type and data type to json
	getJson: function(target_url, data, success_callback)
	{
		var inst = new Hg();
		inst.initHg(success_callback, target_url);
		inst.async = this.async;

		var req =
		{
			type: "GET",
			url: inst.url,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: data,
			success: function(data) { inst.hgCallback(data) },
			error: function() { inst.ajaxError() },
			async: inst.async
		};

		return (jQuery.ajax(req));
	},

	// perform ajax post operation
	post: function(targetUrl, data, successCallback, dataType)
	{
		var inst = new Hg();
		inst.initHg(successCallback, targetUrl);

		inst.errorCallback = this.errorCallback;
		inst.enableValidation = this.enableValidation;
		inst.async = this.async;
		//set a custom timeout
		inst.timeout = this.timeout;

		if (typeof(dataType) == "undefined" || dataType == "")
			dataType = "json";

		if (dataType == "json")
		{
			inst.ret = this.postJson(inst.url, data, successCallback);
			return (inst);
		}

		inst.ret = jQuery.post(inst.url, data, function(data)
		{
			inst.hgCallback(data);
		}, dataType, { timeout : this.timeout },
		{ async: inst.async } );
		return (inst);
	},

	// perform ajax post operation with all form elements within a container
	postElems: function(target_url, req, success_callback, datatype)
	{
		// req has the following properties:
		//		.container	- name of jQuery selector for form container
		//		.action		- name of 'action' property to include in post data
		//		.req		- name of 'req' property to include in post data

		var inst = new Hg();
		inst.initHg(success_callback, target_url);
		inst.async = this.async
		if (typeof(datatype) == "undefined" || datatype == null)
			datatype = "json";

		// collect data from the container
		var data = jQuery(req.container).find("input").serializeArray();
		data = jQuery.merge(data, jQuery(req.container).find("select").serializeArray());
		data = jQuery.merge(data, jQuery(req.container).find("textarea").serializeArray());
		// add the action and call attributes
		data.push( { name: "action", value: req.action } );
		data.push( { name: "req", value: req.req } );

		inst.ret = jQuery.post(inst.url, data, function(data)
		{
			inst.hgCallback(data)
		}, datatype,
		{ async: inst.async });
		return (inst);
	},

	// perform ajax post, forcing content type and data type to json
	postJson: function(target_url, data, success_callback)
	{
		var inst = new Hg();
		inst.initHg(success_callback, target_url);
		inst.async = this.async;

		inst.errorCallback = this.errorCallback;
		inst.enableValidation = this.enableValidation;
		var req =
		{
			type: "POST",
			url: inst.url,
			dataType: "json",
			data: data,
			timeout: this.timeout,
			success: function(data) { inst.hgCallback(data) },
			error: function() { inst.ajaxError() },
			async: inst.async
		};

		inst.ret = jQuery.ajax(req);
		return (inst);
	},

	//sets an optional timeout
	setTimeout: function(seconds)
	{
		this.timeout = seconds;
		return (this);
	},

	// turns off or off validation
	setValidation: function(val)
	{
		if (typeof(val) != "undefined")
		{
			if (val)
				this.enableValidation = 1;
			else
				this.enableValidation = 0;
		}
		return (this);
	},

	// disables asynchronous calls for current instance
	disableAsync: function()
	{
		this.async = false;
		return (this);
	},

	// sets the error callback function for this instance
	setErrorCallback: function(errCallback)
	{
		this.errorCallback = errCallback;
		return (this);
	},

	// sets the form element type
	setFormElement: function(sElemName)
	{
		// Used to set the form element type. This is the element type that wraps
		// the individual <form> elements and is used to add validation messages
		// to the DOM.
		// If you are using tables, this should be "td". If each element is wrapped
		// in a <div> use "div". If you're using <li>s then "li".
		this.formElementType = sElemName;
		return (this);
	},

	// standard handler for ajax errors
	ajaxError: function(XMLHttpReq, textStatus, errorThrown)
	{
		this.error = true;				// set error state to true
		if (typeof(XMLHttpReq) == "undefined")
			this.errorText = "Timeout";
		else
			this.errorText = XMLHttpReq.responseText;
		this.errorStatus = textStatus;
$Hg.log("**ajax error " + this.errorStatus + ": " + this.errorText);

		// TODO: display dialog with error

		if (typeof(this.errorCallback) == "function")
			this.errorCallback();			// it's a function, we can safely call it
	},

	// perform console logging if console is available
	log: function(sMsg)
	{
		if (window.console && window.console.firebug)
			console.log(sMsg);
	}
}

$Hg = new Hg();				// create global instance
//$Hg.log("created global $Hg instance");

// EOF
