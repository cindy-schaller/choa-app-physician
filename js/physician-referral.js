/*global
Chart, GC, PointSet, Raphael, console, $,
jQuery, debugLog,
XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function(NS, $) 
{

    "use strict";

    var refreq_ID = "19179006";
    var patientID = (window.sessionStorage.getItem('patientid_global')) ?
                window.sessionStorage.getItem('patientid_global') : "11034584";
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

        


    function isPhysicianReferralVisible() 
    {
        return GC.App.getViewType() == "referral";
    }

    
    


    var json_ReferralRequest_to_community_coordinator_data ={

       "resourceType": "ReferralRequest",
       "text": {
          "status": "generated",
          "div": "<div>referralRequest to Care Coordinator Team for Patient/" + patientID + " for childhood obesity support</div>"
       },
       "status": "pending",
         "type": {
          "coding": [
             {
                "system": "http://snomed.info/sct",
                "code": "700274009",
                "display": "Referral for procedure"
             }
          ]
       },
       "specialty": {
          "coding": [
             {
                "system": "http://snomed.info/sct",
                "code": "710915002",
                "display": "Referral to community service"
             }
          ]
       },
       "priority": {
          "coding": [
             {
                "system": "http://snomed.info/sct",
                "code": "394848005",
                "display": "Normal priority"
             }
          ]
       },
       "patient": {
          "reference": "Patient/" + patientID,
          "display": "Clark Kent"
       },
       "requester": {
          "display": "Serena Shrink"
       },
       "recipient": [
          {
             "reference": "Organization/19178873",
             "display": "Care Coordinator Team "
          }
       ],
       "dateSent": "2014-02-14",
       "reason": {
          "coding": [
             {
                "fhir_comments": [
                   "   The problem is Childhood obesity "
                ],
                "system": "http://snomed.info/sct",
                "code": "10001005",
                "display": "Childhood obesity"
             }
          ]
       },
       "description": "Clark is suffering childhood obesity with a BMI > 31.0. Clark is being refered to the Care Coordinator Team for help accessing community based resources that will help him in reaching a healthy BMI. 5-2-1-0 is an evidence-based prevention message centered on recommendations for Childhood Obesity Assessment, Prevention and Treatment sponsored by the Centers for Disease Control and Prevention (CDC). 5-2-1-0 recommends 5 or More Fruits & Vegetables a day, 2 Hours or Less of Screen Time a day, 1 Hour or More of Active Play a day, and 0 Sugary Drinks a day. The patient was administered the Healthy Eating Questionnaire and an analysis of the results indicates the 5-2-1-0 order of priority for this patient is as follows: 1) underconsumption of fruits and vegitables, 2) too much screen time 3) lack of active play time 4) overconsumption of sugary drinks",     
       "serviceRequested": [
          {
             "coding": [
                {
                   "system": "http://snomed.info/sct",
                   "code": "347421000000106",
                   "display": "community care   for childhood obesity"
                }
             ]
          }
       ]
    }

   //used to POST a referralRequest to the community coordinator
   var CoordinatorReferralPOST = function (){
        var CoordinatorReferralPOST = null;
         $.ajax({
            type: 'POST',
            async: false,
            global: false,
            url: 'https://mihin.shib.al/fhir/baseDstu2/ReferralRequest',
            data: JSON.stringify(json_ReferralRequest_to_community_coordinator_data),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                CoordinatorReferralPOST = data;
                console.log( CoordinatorReferralPOST.valueOf());
                alert(CoordinatorReferralPOST.issue[0].diagnostics);
                var value = CoordinatorReferralPOST.issue[0].diagnostics;
                var num =  value.match(/\d+/g);
                refreq_ID = num[0];
        
                POSTcomm();
            },
            
        });
        return CoordinatorReferralPOST;
    }; 

    function POSTcomm() 
    {
       
      //this must be only after the referralrequest 
      //the "reference": "ReferralRequest/19179006" field **must** be updated 
      //to the real ID of the ReferralRequest

      //CoordinatorReferralPOST can be parsed to get the correct ID number

      //post request to community-facing app
          CoordinatorCommunicationPOST();
          
         
     };

      


     //used to POST a communication  to the community coordinator
     var CoordinatorCommunicationPOST = function (){

    var json_communication_to_community_coordinator_data ={
          "resourceType": "Communication",
            "text": {
               "status": "generated",
               "div": "<div>a referralRequest has been sent to the childhood obesity patient coordinator </div>"
            },
            
            
            "category": {
               "coding": [
                  {
                     "system": "http://acme.org/messagetypes",
                     "code": "notification"
                  }
               ],
               "text": "notification"
            },
            "sender": {
               "display": "A. Langeveld"
            },
            "recipient": [
               {
                  "reference": "Organization/19178873"
               }
            ],
            "payload": [
               {
                  "contentString": "referralRequest for Patient/" + patientID + " for childhood obesity for community cooordination."
               },
             {
                  "contentReference": {
                     "fhir_comments": [
                        " Reference to the referralRequest "
                     ],
                     "reference": "ReferralRequest/" + refreq_ID
                  }
               }
             ],
            "status": "pending",
            "sent": "2014-12-12T18:01:10-08:00",
            "subject": {
               "reference": "Patient/" + patientID
            }
          }
      
          var CoordinatorCommunicationPOST = null;
           $.ajax({
              type: 'POST',
              async: false,
              global: false,
              url: 'https://mihin.shib.al/fhir/baseDstu2/Communication',
              data: JSON.stringify(json_communication_to_community_coordinator_data),
              dataType: 'json',
              contentType: 'application/json',
              success: function (data) {
                  CoordinatorCommunicationPOST = data;
                  console.log( json_ReferralRequest_to_community_coordinator_data);
                  console.log(json_communication_to_community_coordinator_data);
                  console.log( CoordinatorCommunicationPOST);
                  alert(CoordinatorCommunicationPOST.issue[0].diagnostics);
         
              }
          });
          //return CoordinatorCommunicationPOST;
      }; 
  




    function renderPhysicianReferral( container ) 
    {
       
        

        $(container).empty();

        

        //
        var patientId =  patientID;
    
        if(!patientId)
        {
            throw "Patient ID is a required parameter";
        }
        var referralHeader = "";
        var referralBody = "";
        var referralButtons = "";
        var emailBody = "";

        referralHeader += ("<div id='physician-referral-header' class='physician-referral-container'>");
        referralHeader += ("<h1 style='font-size: 28px; font-weight:bold;'>Physician's Referral</h1>");
        referralHeader += ("<h1 style='font-size: 16px;'>Patient: " + patientId + "</h1>");
        referralHeader += ("</div>");

        referralBody += ("<div id='physician-referral-body' class='physician-referral-container'>");
        referralBody += ("<h1 style='font-size: 20px; font-weight:bold;'>Recommendations based on questionnaire: </h1>");

        referralBody += ("<textarea id='ref-recs' rows='5' cols='50'>" + window.sessionStorage.getItem("analysis") + "</textarea>");

        referralBody += ("<h1 style='font-size: 20px; font-weight:bold;'>ICD-10 code (Physician use only): </h1>");

        referralBody += ("<select id='icd-selection'>");
        referralBody += ("<option value='E66.01'>Morbid Obesity (E66.01)</option>");
        referralBody += ("<option value='E66.09'>Other obesity due to excess calories(E66.09)</option>");
        referralBody += ("<option value='E66.1'>Drug-induced obesity (E66.1)</option>");
        referralBody += ("<option value='E66.2'>Morbid (severe) obesity with alveolar hypoventilation (E66.2)</option>");
        referralBody += ("<option value='E66.3'>Overweight (E66.3)</option>");
        referralBody += ("<option value='E66.8'>Other Obesity (E66.8)</option>");
        referralBody += ("<option selected='selected' value='E66.9'>Obesity, unspecified(E66.9)</option>");
        referralBody += ("<option value='E63.6'>Underweight(R63.6)</option>");
        referralBody += ("</select>");
        referralBody += ("<br></br>");

        referralBody += ("<h1 style='font-size:20px'>Lab Results:</h1>");
        referralBody += ("<p style='font-style:italic;'>Lab in progress</p>");
        referralBody += ("<br></br>");
        referralBody += ("</div>");

        emailBody += "Diagnosis: ";
        emailBody += localStorage.getItem("icd");
        console.log("EMAIL ICD SELECTION");
        console.log(localStorage.getItem("icd"));

        emailBody += " Recommendations:";
        emailBody += window.sessionStorage.getItem("analysis");
        console.log("EMAIL BODY");
        console.log(emailBody);

        referralButtons += ("<div id='physician-referral-buttons' class='physician-referral-container'>");
        referralButtons += ("<a id='ref-export' type='button' href='mailto:someone@CDC.gov?subject=Physician%20Referral&body="+emailBody+"' style='margin-right: 10px;'>Export Data</button>");
        referralButtons += ("<a id='ref-submit' type='button' style='margin-right: 10px;'>Submit Referrals</a>");
        referralButtons += ("</div>");

        $(container).append(referralHeader);
        $(container).append(referralBody);
        $(container).append(referralButtons);


        $('#ref-submit').click(function() {
          //pass in q-based recommendation & icd-10 code
          json_ReferralRequest_to_community_coordinator_data.description = $('#ref-recs').val();
          json_ReferralRequest_to_community_coordinator_data.icd = $('#icd-selection option:selected').text();
          
          //post request to community-facing app
          CoordinatorReferralPOST();
          
          alert('[SUCCESS] Referral Submitted');
          console.log("json_ReferralRequest_to_community_coordinator_data");
          console.log(json_ReferralRequest_to_community_coordinator_data);
        });
         $('select').change(function () {
             var optionSelected = $(this).find("option:selected");
             localStorage.setItem("icd",optionSelected);
             localStorage.setItem("icd",optionSelected);
         });
        $('select').on('change', function () {
             var selectedValue = this.selectedOptions[0].value;
             localStorage.setItem("icd",selectedValue);
             localStorage.setItem("icd",selectedValue);
        });

    }

    

    NS.PhysicianReferral = 
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
