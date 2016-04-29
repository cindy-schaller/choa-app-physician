/*global
Chart, GC, PointSet, Raphael, console, $,
jQuery, debugLog,
XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function(NS, $) 
{

    "use strict";

    var selectedIndex = -1,

        /**
         * The cached value from GC.App.getMetrics()
         */
        metrics = null,

        PRINT_MODE = $("html").is(".before-print"),

        EMPTY_MARK = PRINT_MODE ? "" : "&#8212;",

        MILISECOND = 1,
        SECOND     = MILISECOND * 1000,
        MINUTE     = SECOND * 60,
        HOUR       = MINUTE * 60,
        DAY        = HOUR * 24,
        WEEK       = DAY * 7,
        MONTH      = WEEK * 4.348214285714286,
        YEAR       = MONTH * 12,

        shortDateFormat = 
        {
            "Years"   : "y",
            "Year"    : "y",
            "Months"  : "m",
            "Month"   : "m",
            "Weeks"   : "w",
            "Week"    : "w",
            "Days"    : "d",
            "Day"     : "d",
            separator : " "
        };

    function isPhysicianRecordVisible() 
    {
        return GC.App.getViewType() == "record";
    }

    
var json_observation_data ={
                  "resourceType": "Observation",
                  "status": "final",
                  "code": {
                    "coding": [
                      {
                        "system": "http://loinc.org",
                        "code": "39156-5",
                        "display": "BMI"
                      }
                    ]
                  },
                  "subject": {
                    "reference": "Patient/18791941"
                  },
                   "performer": [{
                      "display": "A. Langeveld"
                    }],
                  "issued": "2013-04-04T13:27:00+01:00", 
                  "effectiveDateTime": "2013-04-02",   
                  "valueQuantity": {
                    "value": 31.0,
                  }
                };

        //this function can be used to POST notes the physician makes in the Observation input box on phys-record tab
        //json_observation_data is set up currently as a BMI observation but that should be changed
        //the physician notes should be placed in one (which one??) of the fields in the json struct
        var ObeseObservationsPOST = (function (){
            var ObeseObservationsPOST = null;
             $.ajax({
                type: 'POST',
                async: false,
                global: false,
                url: 'http://52.72.172.54:8080/fhir/baseDstu2/Observation',
                data: JSON.stringify(json_observation_data),
                dataType: 'json',
                contentType: 'application/json',
                success: function (data) {
                    ObeseObservationsPOST = data;
                    console.log( ObeseObservationsPOST);
                }
            });
            return ObeseObservationsPOST;
        })();



//Resource Condition   http://hl7.org/fhir/condition-examples.html
        //Use to record detailed information about conditions, problems or diagnoses recognized by a clinician.
        
        //childhood obesity snomed 415530009
        //http://phinvads.cdc.gov/vads/http:/phinvads.cdc.gov/vads/ViewCodeSystemConcept.action?oid=2.16.840.1.113883.6.96&code=415530009

        //"Problem"  55607006,  
        // SEVERITY  can be 3 levels:  24484000 Severe, 6736007 Moderate  , 255604002, Mild

        
        var json_condition_data = {
          "resourceType": "Condition",
          "patient": {
            "reference": "Patient/18791941"
          },
          "asserter": {
            "display": "A. Langeveld"
          },
          "dateRecorded": "2013-03-11",
          "code": {
            "coding": [
              {
                "fhir_comments": [
                  "  The problem is Childhood obesity "
                ],
                "system": "http://snomed.info/sct",
                "code": "415530009",
                "display": "Childhood obesity"
              }
            ]
          },
          "category": {
            "coding": [
              {
                "fhir_comments": [
                  "  Childhood obesity is certainly a moderate to severe problem  "
                ],
                "system": "http://snomed.info/sct",
                "code": "55607006",
                "display": "Problem"
              },
              {
                "system": "http://hl7.org/fhir/condition-category",
                "code": "finding"
              }
            ]
          },
          "verificationStatus": "confirmed",
          "severity": {
            "coding": [
              {
                "system": "http://snomed.info/sct",
                "code": "6736007",
                "display": "Moderate"
              }
            ]
          },
          "onsetDateTime": "2013-03-08",
          "evidence": [
            {
              "detail": [
                {       
                  "display": "BMI"
                }
              ]
            }
          ]

        }


        //should be triggered by a button labled something like "POST Obesity diagnosis"
        var ObesityConditionPOST = (function (){
             var ObesityConditionPOST = null;
                $.ajax({
                type: 'POST',
                async: false,
                global: false,
                url: 'http://52.72.172.54:8080/fhir/baseDstu2/Condition',
                data: JSON.stringify(json_condition_data),
                dataType: 'json',
                contentType: 'application/json',
                success: function (data) {
                    ObesityConditionPOST = data;
                    console.log( ObesityConditionPOST);
                }
            });
            return ObesityConditionPOST;
        })();



    function renderPhysicianRecord( container ) 
    {
       
        

        $(container).empty();

        

        //hardcoded for now
        var patientId = 18791941;
    
        if(!patientId)
        {
            throw "Patient ID is a required parameter";
        }
       
        var recordHeader = "";
        var recordBody = "";
        var recordButtons = "";

        recordHeader += ("<h1 style='font-size: 28px; font-weight:bold;'>Patient Record</h1>");
        recordHeader += ("<h1 style='font-size: 16px;'>Patient: " + patientId + "</h1>");
        recordHeader += ("<br></br>");

        recordBody += ("<h1 style='font-size: 20px; font-weight:bold;'>Diagnosis: </h1>");
        recordBody += ("<textarea rows='6' cols='50'>Obese I</textarea>");
        recordBody += ("<br></br>");
        recordBody += ("<br></br>");
        
        recordBody += ("<h1 style='font-size: 20px; font-weight:bold;'>Observations: </h1>");
        recordBody += ("<textarea rows='6' cols='50'>observations</textarea>");
        recordBody += ("<br></br>");
        recordBody += ("<br></br>");

        recordBody += ("<h1 style='font-size: 20px; font-weight:bold;'>Order the following lab tests: </h1>");
        recordBody += ("<h1>Body fat test</h1>");
        recordBody += ("<h1>Blood pressure test</h1>");
        recordBody += ("<br></br>");

        recordButtons += ("<button>Push Diagnosis</button>")

        $(container).append(recordHeader);
        $(container).append(recordBody);
        $(container).append(recordButtons);

        
    }

    

    NS.PhysicianRecord = 
    {
        render : function() 
        {

                renderPhysicianRecord("#view-record");

        }
    };

    $(function() 
    {
        if (!PRINT_MODE) 
        {

            $("html").bind("set:viewType set:language", function(e) 
            {
                if (isPhysicianRecordVisible()) 
                {
                    renderPhysicianRecord("#view-record");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) 
            {
                if (isPhysicianRecordVisible()) 
                {
                    renderPhysicianRecord("#view-record");
                }
            });

            GC.Preferences.bind("set", function(e) 
            {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") 
                {
                    if (isPhysicianRecordVisible()) 
                    {
                        renderPhysicianRecord("#view-record");
                    }
                }
            });


            GC.Preferences.bind("set:timeFormat", function(e) 
            {
                renderPhysicianRecord("#view-record");
            });

       }
    });

}(GC, jQuery));
