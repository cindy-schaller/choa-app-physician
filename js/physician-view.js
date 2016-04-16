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
        // alert(JSON.stringify(patientCall));
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
        var theQuestions = $("<div></div>").addClass("col-md-4 col-md-offset-4");
        theQuestions.attr("id", "questions-div").attr("width", "50%");
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

            console.log(questionnaireCall);

            if (questionnaireCall.entry) {
                var questionnaire = questionnaireCall.entry[0].resource;
            }
            console.log(questionnaire);
            alert(JSON.stringify(questionnaire));
            var questionnaireLastUpdated = questionnaire.meta.lastUpdated ? questionnaire.meta.lastUpdated.split("T")[0] : "";
            var questionnaireElements = questionnaire.group;
            var questionnaireTitle = questionnaireElements.title;
            alert(questionnaireTitle);

            var questions = {};
            var options = [];
            alert(questionnaireElements.question.length);
            for (var i = 0; i < questionnaireElements.question.length; i++) {
                var linkID = questionnaireElements.question[i].linkId;
                for (var j = 0; j < questionnaireElements.question[i].option[j].length; j++) {
                    var choiceNum = questionnaireElements.question[i].option[j].code;
                    alert.(JSON.stringify(choiceNum));
                    var optionText = questionnaireElements.question[i].option[j].display;
                    options.push([choiceNum, optionText]);
                }
                // alert(JSON.stringify(options));

            }
            // var questionsAsked = [];
            // var questionOptions = [];
            // var questions = [];
            // for (var i = 0; i < questionnaireElements.question.length; i++) {
            //     var linkID = (questionnaireElements.question[i].linkId ? questionnaireElements.question[i].linkId : "");
            //     // alert(JSON.stringify(questionnaireElements.question[i].option));
            //     for (var j = 0; j < questionnaireElements.question[i].option.length; j++) {
            //         if (questionnaireElements.question[i].option[j].display) {
            //             questionOptions[i].push(questionnaireElements.question[i].option[j].display);
            //         }
            //     }
            //     alert(JSON.stringify(questionOptions[i]));
            //     questions.push([questionnaireElements.question[i].linkId, questionOptions]);
            //     // console.log(i + questions);
            // }
            // // alert(JSON.stringify(questions));
            //
            // if (questionnaireResponseCall.entry) {
            //     var responses = questionnaireResponseCall.entry[0].resource;
            // }
        });




        //
        // var theQuestions = $("<div></div>").addClass("col-md-4 col-md-offset-4");
        // theQuestions.attr("id", "questions-div").attr("width", "50%");
        // var questionsID = (window.sessionStorage.getItem('questionsID')) ?
        //     window.sessionStorage.getItem('questions_id') : "18791835";
        //
        // $.ajax({
        //     url: 'http://52.72.172.54:8080/fhir/baseDstu2/Questionnaire?_id=' + questionsID,
        //     dataType: 'json',
        //     success: $.extend({})
        // });
        // function mergeQuestionHTML(questionsResult) {
        //     console.log("mergeQuestionHTML");
        //     console.log(questionsResult);
        //     if (!questionsResult) return;
        //     if (questionsResult.entry) {
        //         questionsResult = questionsResult.entry[0].resource;
        //     }
        //     console.log(questionsResult);
        //     var lastUpdated = questionsResult.meta.lastUpdated ? questionsResult.meta.lastUpdated.split("T")[0] : "";
        //     var questionnaireElements = questionsResult.group;
        //     var questionnaireTitle = questionnaireElements.title;
        //     var questionsAsked = [];
        //     var questionsOptions = [];
        //     var questions =[];
        //     for (var i = 0; i < questionnaireElements.question.length; i++) {
        //         var linkId = (questionnaireElements.question[i].linkId ? questionnaireElements.question[i].linkId : "");
        //         var text = (questionnaireElements.question[i].text ? questionnaireElements.question[i].text : "");
        //         for (var j = 0; j < questionnaireElements.question[i].option.length; j++) {
        //             var options = questionnaireElements.question[i].option[j];
        //             questionsOptions.push(options);
        //             questionsAsked.push({linkId, text, questionsOptions});
        //
        //         }
        //     }
        //     alert(JSON.stringify(questionsAsked));
        // }
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
