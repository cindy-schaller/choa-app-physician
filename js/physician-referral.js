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

        


    function isPhysicianReferralVisible() 
    {
        return GC.App.getViewType() == "referral";
    }

    
    


    var json_ReferralRequest_to_community_coordinator_data ={

       "resourceType": "ReferralRequest",
       "text": {
          "status": "generated",
          "div": "<div>referralRequest to Care Coordinator Team for Patient/18791941 for childhood obesity support</div>"
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
          "reference": "Patient/18791941",
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
   var CoordinatorReferralPOST = (function (){
        var CoordinatorReferralPOST = null;
         $.ajax({
            type: 'POST',
            async: false,
            global: false,
            url: 'http://52.72.172.54:8080/fhir/baseDstu2/ReferralRequest',
            data: JSON.stringify(json_ReferralRequest_to_community_coordinator_data),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                CoordinatorReferralPOST = data;
                console.log( CoordinatorReferralPOST);
            }
        });
        return CoordinatorReferralPOST;
    })(); 


    $.when(CoordinatorReferralPOST ).then(function() 
    {
      //this must be only after the referralrequest 
      //the "reference": "ReferralRequest/19179006" field **must** be updated 
      //to the real ID of the ReferralRequest

      //CoordinatorReferralPOST can be parsed to get the correct ID number

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
              "contentString": "referralRequest for Patient/18791941 for childhood obesity for community cooordination."
           },
         {
              "contentReference": {
                 "fhir_comments": [
                    " Reference to the referralRequest "
                 ],
                 "reference": "ReferralRequest/19179006"
              }
           }
         ],
        "status": "pending",
        "sent": "2014-12-12T18:01:10-08:00",
        "subject": {
           "reference": "Patient/18791941"
        }
      }


     //used to POST a communication  to the community coordinator
     var CoordinatorCommunicationPOST = (function (){
          var CoordinatorCommunicationPOST = null;
           $.ajax({
              type: 'POST',
              async: false,
              global: false,
              url: 'http://52.72.172.54:8080/fhir/baseDstu2/Communication',
              data: JSON.stringify(json_communication_to_community_coordinator_data),
              dataType: 'json',
              contentType: 'application/json',
              success: function (data) {
                  CoordinatorCommunicationPOST = data;
                  console.log( CoordinatorCommunicationPOST);
              }
          });
          return CoordinatorCommunicationPOST;
      })(); 
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
