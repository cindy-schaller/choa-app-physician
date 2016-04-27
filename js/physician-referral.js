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

        var ObesityObservationPOST = (function (){
             var ObesityObservationPOST = null;
                $.ajax({
                type: 'POST',
                async: false,
                global: false,
                url: 'http://52.72.172.54:8080/fhir/baseDstu2/Condition',
                data: JSON.stringify(json_data),
                dataType: 'json',
                contentType: 'application/json',
                success: function (data) {
                    ObesityObservationPOST = data;
                    console.log( ObesityObservationPOST);
                }
            });
            return ObesityObservationPOST;
        })();



    function isPhysicianReferralVisible() 
    {
        return GC.App.getViewType() == "referral";
    }

    

    function renderPhysicianReferral( container ) 
    {
       
        

        $(container).empty();

        

        //hardcoded for now
        var patientId = 18791941;
    
        if(!patientId)
        {
            throw "Patient ID is a required parameter";
        }
      

        $(container).append("<h1 style='font-size: 28px; font-weight:bold;'>Patient Referral</h1>");
        $(container).append("<h1 style='font-size: 16px;'>Patient: " + patientId + "</h1>");
        $(container).append("<br></br>");

        $(container).append("<h1 style='font-size: 20px; font-weight:bold;'>Recommendations based on questionnaire: </h1>");

        $(container).append("<textarea rows='5' cols='50'>Recommendations:</textarea>");
        $(container).append("<br></br>");

        $(container).append("<h1 style='font-size: 20px; font-weight:bold;'>Physician recommendations (ICD-10): </h1>");

        $(container).append("<textarea rows='5' cols='50'>ICD-10 codes:</textarea>");
        $(container).append("<br></br>");

        $(container).append("<h1 style='font-size: 20px; font-weight:bold;'>Lab Test Recommendations: </h1>");

        $(container).append("<textarea rows='5' cols='50'>Lab-based Referrals:</textarea>");
        $(container).append("<br></br>");

        $(container).append("<h1>Order the following lab tests:</h1>");
        $(container).append("<h1>Body fat test</h1>");
        $(container).append("<br></br>");

        $(container).append("<button style='height: 30px; background-color: #bbccff;padding:5px;'>Export Data</button>");
        $(container).append("<button style='height: 30px; background-color: #bbccff;padding:5px;'>Submit Referrals</button>");

    }

    

    NS.PhysicianRecord = 
    {
        render : function() 
        {

                renderPhysicianReferral("#view-referral");

        }
    };

    $(function() 
    {
        if (!PRINT_MODE) 
        {

            $("html").bind("set:viewType set:language", function(e) 
            {
                if (isPhysicianReferralVisible()) 
                {
                    renderPhysicianReferral("#view-referral");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) 
            {
                if (isPhysicianReferralVisible()) 
                {
                    renderPhysicianReferral("#view-referral");
                }
            });

            GC.Preferences.bind("set", function(e) 
            {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") 
                {
                    if (isPhysicianReferralVisible()) 
                    {
                        renderPhysicianReferral("#view-referral");
                    }
                }
            });


            GC.Preferences.bind("set:timeFormat", function(e) 
            {
                renderPhysicianReferral("#view-referral");
            });

       }
    });

}(GC, jQuery));
