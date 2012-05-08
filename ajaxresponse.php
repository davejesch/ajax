<?php

// ajax response

class AjaxResponse
{
	public $session_timeout = FALSE;
	public $focus = NULL;						// focus element
	public $errors = array();					// list of errors
	public $notices = array();					// list of notices
	public $success = 0;						// assume no success
	public $form = NULL;						// form id
	public $validation = array();				// validation information

	public $data = array();

	// constructor
	public function __construct()
	{
		if (!is_user_logged_in())
			$this->session_timeout = 1;
	}

	// return TRUE if instance is tracking any errors
	public function hasErrors()
	{
		if (count($this->errors) || count($this->validation))
			return (TRUE);
		return (FALSE);
	}

	// clears previous value in session timeout flag
	public function clearTimeout()
	{
		$this->session_timeout = 0;
	}

	// set a data property to be returned under the 'data.' element
	public function set($sName, $sValue)
	{
		$this->data[$sName] = $sValue;
	}

	// set the form name
	public function form($sFormId)
	{
		$this->form = $sFormId;
	}

	// sets the form id to have focus
	public function focus($sElementId)
	{
		$this->focus = $sElementId;
	}

	// sets the success flag
	public function success($value)
	{
		$this->success = ($value ? 1 : 0);
	}

	// return TRUE if success value is set on
	public function isSuccess()
	{
		if ($this->success == 1)
			return (TRUE);
		return (FALSE);
	}

	// adds an error message to the 'errors.' element
	public function error($sMsg)
	{
		$this->errors[] = $sMsg;
	}

	// adds an notification message to the 'notices.' element
	public function notice($sMsg)
	{
		$this->notices[] = $sMsg;
	}

	// adds a validation message to the 'validation.' element
	public function validation($sField, $sMsg)
	{
		$val = new AjaxValidationObj($sField, $sMsg);
		$this->validation[] = $val;
		if ($this->focus == NULL)				// if the focus elemnet has not been set
			$this->focus($sField);				// set it here
	}

	// sends data to browser
	public function send()
	{
		$sOutput = $this->toString();			// construct data to send to browser
		echo $sOutput;							// send data to browser
		exit(0);								// stop script
	}

	// convert data to a json response
	public function toString()
	{
		$aOutput = array();

		if ($this->session_timeout)
			$aOutput['session_timeout'] = 1;

		if ($this->focus != NULL)
			$aOutput['focus'] = $this->focus;

		if (count($this->errors))
			$aOutput['errors'] = $this->errors;

		if (count($this->notices))
			$aOutput['notices'] = $this->notices;

		if (count($this->errors) + count($this->validation) > 0)
			$aOutput['has_errors'] = 1;
		else
			$aOutput['has_errors'] = 0;

		if ($this->success)
			$aOutput['success'] = 1;
		else
			$aOutput['success'] = 0;

		if ($this->form !== NULL)
			$aOutput['form'] = $this->form;

		if (count($this->validation))
			$aOutput['validation'] = $this->validation;

		if (count($this->data))
			$aOutput['data'] = $this->data;

		$sOutput = json_encode($aOutput);
		return ($sOutput);
	}
}

class AjaxValidationObj
{
    public $fieldName = NULL; // required name of field the validation error occured on
    public $errorMessage = NULL; // required validation error message
    public $previousValue = NULL; // optional previous value for the field

    /**
     * AjaxValidation::__construct()
     *
     * @description - used to ensure that both a field name and an error message are included in the validation message
     * @param string $sFieldName - required
     * @param string $sErrorMessage - required
     * @param mixed $previousValue - optional
     * @return
     */
    public function __construct($sFieldName, $sErrorMessage, $previousValue = NULL)
    {
        $this->fieldName = $sFieldName;
        $this->errorMessage = $sErrorMessage;
        $this->previousValue = $previousValue;
    }
}


// EOF