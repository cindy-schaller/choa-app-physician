/*global
Chart, GC, PointSet, Raphael, console, $,
jQuery, debugLog,
XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function(NS, $)
{

    "use strict";

    var selectedIndex = -1,
        PATIENT,

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

    function isPhysicianViewVisible()
    {
        console.log("start");
        return GC.App.getViewType() == "view";
    }

    function renderPhysicianView(container) {
        $(container).empty();

        var thePatient = $("<div></div>").addClass("col-md-4");
        thePatient.attr("id", "thePatient-div").attr("width", "50%");
        $(container).append(thePatient);
        var patientID = (window.sessionStorage.getItem('patientID')) ?
            window.sessionStorage.getItem('patientID') : "18791941";
        var patientCall = (function () {
            var patientCall = null;
            $.ajax({
                async: false,
                global: false,
                url: 'http://52.72.172.54:8080/fhir/baseDstu2/Patient?_id=' + patientID,
                dataType: 'json',
                success: function (data) {
                    patientCall = data;
                }
            });
            return patientCall;
        })();
        var questionnaireResponseCall = (function () {
            var questionnaireResponseCall = null;
            $.ajax({
                async: false,
                global: false,
                url: 'http://52.72.172.54:8080/fhir/baseDstu2/QuestionnaireResponse?patient=' + patientID,
                dataType: 'json',
                success: function (data) {
                    questionnaireResponseCall = data;
                }
            });
            return questionnaireResponseCall;
        })();
        var theQuestions = $("<div></div>").addClass("col-md-4 col-md-offset-5");
        theQuestions.attr("id", "theQuestions-div").attr("width", "50%");
        $(container).append(theQuestions);
        var questionsID = (window.sessionStorage.getItem('questionsID')) ?
            window.sessionStorage.getItem('questions_id') : "18791835";
        var questionnaireCall = (function () {
            var questionnaireCall = null;
            $.ajax({
                async: false,
                global: false,
                url: 'http://52.72.172.54:8080/fhir/baseDstu2/Questionnaire?_id=' + questionsID,
                dataType: 'json',
                success: function (data) {
                    questionnaireCall = data;
                }
            });
            return questionnaireCall;
        })();

        $.when(patientCall, questionnaireResponseCall, questionnaireCall).then(function() {
            console.log("thePatient: " + patientCall);
            if (patientCall.entry) {
                var patient = patientCall.entry[0].resource;
            }
            console.log(patient);
            var patientId = (patient.id ? patient.id : "");
            var patientVersion = (patient.meta.versionId) ? patient.meta.versionId : "";
            var patientLastUpdated = patient.meta.lastUpdated ? patient.meta.lastUpdated : "";
            var patientName = patient.name[0] ? patient.name[0].given[0] + " " + patient.name[0].family[0] : "";
            var patientGender = patient.gender ? patient.gender : "";
            var patientBDay = patient.birthDate ? patient.birthDate : "";
            var address = (patient.address ?
            (patient.address[0].line ?
                patient.address[0].line + "</br>" : "") +
            (patient.address[0].city ?
                patient.address[0].city + ", " : "") +
            (patient.address[0].state ?
                patient.address[0].state + " " : "") +
            (patient.address[0].postalCode ?
                patient.address[0].postalCode + "" : "") : "");
            var contact = (patient.telecom ?
            (patient.telecom[0].system ?
                patient.telecom[0].system + " " : "") +
            (patient.telecom[0].value ?
                patient.telecom[0].value : "") : "");
            thePatient.append($("<div></div>")
                .addClass("patient-version")
                .attr("id", "patient-version")
                .html("Version: " + patientVersion));
            thePatient.append($("<div></div>")
                .addClass("patient-lastUpdated")
                .attr("id", "patient-lastUpdated")
                .html("Date: " + patientLastUpdated.split("T")[0]));
            thePatient.append($("<div></div>")
                .addClass("patient-id")
                .attr("id", "patient-id")
                .html("ID: " + patientId));
            thePatient.append($("<div></div>")
                .addClass("patient-fullname")
                .attr("id", "patient-fullname")
                .html("Name: " + patientName));
            thePatient.append($("<div></div>")
                .addClass("patient-gender")
                .attr("id", "patient-gender")
                .html("Gender: " + patientGender));
            thePatient.append($("<div></div>")
                .addClass("patient-bday")
                .attr("id", "patient-bday")
                .html("Birthdate: " + patientBDay));
            thePatient.append($("<div></div>")
                .addClass("patient-address")
                .attr("id", "patient-address")
                .html("Address: " + address));
            thePatient.append($("<div></div>")
                .addClass("patient-contact")
                .attr("id", "patient-contact")
                .html("Contact: " + contact));

            if (questionnaireCall.entry) {
                var questionnaire = questionnaireCall.entry[0].resource;
            }
            if (questionnaireResponseCall.entry) {
                var response = questionnaireResponseCall.entry[0].resource;
            }
            var questionnaireId = (questionnaire.id ? questionnaire.id : "");
            var questionnaireVersion = (questionnaire.meta.versionId ? questionnaire.meta.versionId : "");
            var questionnaireLastUpdated = (questionnaire.meta.lastUpdated ? questionnaire.meta.lastUpdated.split("T")[0] : "");
            var responseLastUpdated = (response.meta.lastUpdated ? response.meta.lastUpdated.split("T") : "");
            // TODO add validation and map by linkId
            var qAndA = [];
            for(var i = 0; i < questionnaire.group.question.length; i++) {
                var responseIndex = response.group.question[i].answer[0].valueInteger;
                qAndA.push([(questionnaire.group.question[i].text), (questionnaire.group.question[i].option[responseIndex].display)]);
            }
            theQuestions.append($("<div></div>")
                .addClass("QandA")
                .attr("id", "question-and-answer")
                .html("Questionnaire Responses: : " + qAndA));
        })
    }

    function calculateBMI(weight, height)
    {
        var heightInM = height/100;
        var BMI = weight/(heightInM*heightInM);
        return BMI;
    }

    function obesityThresholds(percentile){

        var OBESE_THRESHOLD = 0.95;
        var OVERWEIGHT_THRESHOLD = 0.85;
        var NORMAL_THRESHOLD = 0.05;

        if (percentile > OBESE_THRESHOLD)
            return "Obese";
        else if (percentile > OVERWEIGHT_THRESHOLD)
            return "Overweight";
        else if (percentile > NORMAL_THRESHOLD)
            return "Normal";
        else
            return "Underweight";
    }

    function getVitals() {
            var out = {
                    height : { value : undefined, "percentile" : null, color : "#0061A1", agemos : null },
                    weight : { value : undefined, "percentile" : null, color : "#F09C17", agemos : null },
                    headc  : { value : undefined, "percentile" : null, color : "#428500", agemos : null },
                    bmi    : { value : undefined, "percentile" : null, color : "#B26666", agemos : null },

                    age : PATIENT.getCurrentAge()
                },
                src    = out.age.getYears() > 2 ? "CDC" : "WHO",
                gender = PATIENT.gender;

            $.each({
                height : { modelProp: "lengthAndStature", dsType : "LENGTH" },
                weight : { modelProp: "weight"          , dsType : "WEIGHT" },
                headc  : { modelProp: "headc"           , dsType : "HEADC"  },
                bmi    : { modelProp: "bmi"             , dsType : "BMI"    }
            }, function(key, meta) {
                var lastEntry = getLastEnryHaving( meta.modelProp ), ds, pct;
                if (lastEntry) {
                    ds = GC.getDataSet(src, meta.dsType, gender, 0, lastEntry.agemos);
                    out[key].value  = lastEntry[meta.modelProp];
                    out[key].agemos = lastEntry.agemos;
                    out[key].date   = new XDate(PATIENT.DOB.getTime()).addMonths(lastEntry.agemos);

                    if (ds) {
                        pct = GC.findPercentileFromX(
                            out[key].value,
                            ds,
                            gender,
                            lastEntry.agemos
                        );
                        if ( !isNaN(pct) ) {
                            out[key].percentile  = pct;
                        }
                    }
                }
            });

            return out;
    }

    NS.PhysicianView =
    {
        render : function()
        {

        console.log(patientResult);

        var patientnameF = patientResult.entry[0].resource.name[0].family ;
        var patientnameG = patientResult.entry[0].resource.name[0].given ;
        var patientgender = patientResult.entry[0].resource.gender;
        var patientbirthdate =  patientResult.entry[0].resource.birthDate;

        PATIENT = GC.App.getPatient();
        
        //TO DO INSERT BMI AND OBESIT CALCULATION HERE
        var bob = getVitals(); 

        var weightActual = bob.weight.value;
        var heightActual = bob.height.value; 
        var BMI = calculateBMI(weightActual,heightActual);      
        var perc = bob.weight.percentile; 
        var status = businessLogic(perc);       

    

        $(container).append("<table><tr><td><b>Patient name: </b></td><td>" + patientnameG +  " " + patientnameF + "</td><tr><td><b>Gender: </b></td><td> " + patientgender + "</td><td></tr><tr><td><b>Birth date: </b></td><td>" + patientbirthdate + "</td></tr><tr><td><b>Weight: </b></td><td>" + weightActual + "</td><tr><td><b>Height: </b></td><td> " + heightActual + "</td><td></tr><tr><td><b>BMI: </b></td><td>" + BMI + "</td><td></tr><tr><td><b>Percentile: </b></td><td>" + perc  +"</td><td></tr><tr><td><b>Obesity Status: </b></td><td>" + status  +"</td></tr></table></br></br>"); 



        $.ajax
        ({

            url: 'http://52.72.172.54:8080/fhir/baseDstu2/QuestionnaireResponse?patient=' 
            + patientId ,

            dataType: 'json',

            success: function(questionareResult) { mergeHTML2(questionareResult,  container);}
                    
        });

        
    }


    function mergeHTML2(questionareResult,  container) 
    {
        if (!questionareResult) 
            return;
        
        if (questionareResult.data) 
        {
            questionareResult = questionareResult.data;
        }

        console.log(questionareResult.entry);

        //for now just show one
       // for (var i = 0; i < questionareResult.entry.length; i++) 
        {
            
           
            var last = questionareResult.entry.length -1
            var qr = questionareResult.entry[last];

            console.log(qr.resource.questionnaire.reference);
            //  should be "Questionnaire/18791830"
            var Qreference  =   ((qr.resource.questionnaire.reference) ?
                                qr.resource.questionnaire.reference
                                : 
                                "Not known, ")  



            var n = Qreference.search("/");
            var Qid = Qreference.substr(n);

            $.ajax
            ({

                url: 'http://52.72.172.54:8080/fhir/baseDstu2/Questionnaire?_id=' 
                + Qid ,

                dataType: 'json',

                success: function(questionare) { mergeHTML_2 (qr, questionare, container);}
                        
            });
        }
    }

    function mergeHTML_2(questionareResult, questionare, container)   
    {

       

        if (!questionare) 
            return;

        var qr = questionareResult
        var q = questionare

        console.log(qr); 
        console.log(q); 

        var date = qr.resource.meta.lastUpdated


        

        var title = q.entry[0].resource.text.div + "<h1><b>date questionnaire administered</b> : " + date  + "</h1>" 

        $(container).append(title);
       
        var str = "<hr>";

        $(container).append(str);

        if (q.entry[0].resource.group.question) 
        {
            for (var ind = 0; ind < q.entry[0].resource.group.question.length ; ind++) 
            {


               

                //so human readable numbers start at 1, not zero
                var human_readable_cnt = ind+1;  
                var rdata = 
                [
                    "</br>" 

                    +
                    
                    "<h2><b>QUESTION " + human_readable_cnt + "</b>: " 
                     

                    +

                     ((q.entry[0].resource.group.question[ind].text) ?
                            q.entry[0].resource.group.question[ind].text + "" 
                            : 
                            "question text Not known, ") 
                    
                    
                    +

                    "</h2>"
                    

                ] 
 
                $(container).append(rdata);


                var o_data_start = "<ul>"
                $(container).append(o_data_start);



                for (var ind_o = 0; ind_o < q.entry[0].resource.group.question[ind].option.length ; ind_o++) 
                {   

                    //so human readable numbers start at 1, not zero
                    var human_readable_ocnt = ind_o+1; 
                    var o_data = 
                    [

                        "<li>" 

                        +
                            ((q.entry[0].resource.group.question[ind].option[ind_o]) ?
                            q.entry[0].resource.group.question[ind].option[ind_o].display+ "" 
                            : 
                            "option Not known, ")
                        
                        +

                        "</li>"
  
                    ]     

                    $(container).append(o_data);
                }

                var o_data_end = "</ul>"
                $(container).append(o_data_start);

                
                $(container).append("");

                //search for final answer
                var question_link_ID = q.entry[0].resource.group.question[ind].linkId;

                var qr_index = -1;
                for (var x = 0; x < qr.resource.group.question.length ; x++) 
                {   

                   //console.log(question_link_ID);
                   //console.log( qr.resource.group.question[x].linkId);
                   if(question_link_ID == qr.resource.group.question[x].linkId)
                   {
                       //console.log( "validated linkId of question to a LinkID in the questionare-response");
                       qr_index = x;
                       break;
                   }
                }

                if(qr_index == -1)
                {
                    
                    console.log("ERROR: could not validate linkId of question to any LinkID in the questionare-response"); 
                    return;
                }

                
                   
                var final_answer = qr.resource.group.question[qr_index].answer[0].valueInteger;
                

                var adata = 
                [
                    ""

                    +

                    
                    
                    "</br> <b> User Selected Response: "

                    + 

                    ((q.entry[0].resource.group.question[ind].option[final_answer]) ?
                            q.entry[0].resource.group.question[ind].option[final_answer].display+ "" 
                            : 
                            "option Not known, ")    

                    +
                    "</b></br></br><hr>"
                   
                ]

                $(container).append(adata);
                
            }
         
        } 

    }

    
     
  




    NS.PhysicianView = 
    {
        render : function() 
        {

                renderPhysicianView("#view-physician");

        }
    };

    $(function()
    {
        if (!PRINT_MODE)
        {

            $("html").bind("set:viewType set:language", function(e)
            {
                if (isPhysicianViewVisible())
                {
                    renderPhysicianView("#view-physician");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e)
            {
                if (isPhysicianViewVisible())
                {
                    renderPhysicianView("#view-physician");
                }
            });

            GC.Preferences.bind("set", function(e)
            {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std")
                {
                    if (isPhysicianViewVisible())
                    {
                        renderPhysicianView("#view-physician");
                    }
                }
            });


            GC.Preferences.bind("set:timeFormat", function(e)
            {
                renderPhysicianView("#view-physician");
            });

       }
    });

}(GC, jQuery));
