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

        var topContainer = $("<div></div>").addClass("row");
        topContainer.attr("id", "thePatient-div");
        $(container).append(topContainer);
        var thePatient = $("<div></div>").addClass("col-xs-6 col-xs-offset-1").attr("id", "thePatientInfo-div");
        topContainer.append(thePatient);
        var patientDBInfo = $("<div></div>").addClass("col-xs-4");
        patientDBInfo.attr("id", "patientDBInfo-div");
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
        var theAnalysis = $("<div></div>").addClass("row");
        theAnalysis.attr("id", "theAnalysis-div");
        $(container).append(theAnalysis);
        var theSurvey = $("<div></div>").addClass("row");
        theSurvey.attr("id", "theSurvey-div");
        $(container).append(theSurvey);
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
            thePatient.append($("<blockquote></blockquote>")
                .append($("<div></div>")
                    .addClass("patient-info")
                    .append($("<div></div>")
                        .addClass("patient-fullname")
                        .attr("id", "patient-fullname")
                        .append($("<strong></strong>")
                            .html(patientName)))
                    .append($("<div></div>")
                        .addClass("patient-contact")
                        .attr("id", "patient-contact")
                        .append($("<abbr></abbr>")
                        .attr("title", "Contact")
                        .html(contact)))
                    .append($("<div></div>")
                        .addClass("patient-address")
                        .attr("id", "patient-address")
                        .append($("<address></address>")
                            .html(address)))
                    .append($("<div></div>")
                        .append($("<small></small>")
                            .addClass("patient-id dt")
                            .attr("id", "patient-id")
                            .html("<strong>Patient ID: </strong>" + patientId)))));

            topContainer.append(patientDBInfo);
            patientDBInfo.append($("<div></div>")
                .addClass("patient-info")
                .append($("<blockquote></blockquote>")
                    .addClass("blockquote-reverse")
                    .append($("<div></div>")
                        .addClass("patient-info")
                        .append($("<div></div>")
                            .addClass("patient-gender text-capitalize")
                            .attr("id", "patient-gender")
                            .html("<strong>Gender: </strong>" + patientGender))
                        .append($("<div></div>")
                            .addClass("patient-bday dt")
                            .attr("id", "patient-bday")
                            .html("<strong>Birthdate: </strong>" + patientBDay))
                        .append($("<small></small>")
                            .append("<footer></footer>")
                                .append($("<div></div>")
                                    .addClass("patient-version")
                                    .attr("id", "patient-version")
                                    .html("<strong>DB Version: </strong>" + patientVersion))
                                .append($("<div></div>")
                                    .addClass("patient-lastUpdated")
                                    .attr("id", "patient-lastUpdated")
                                    .html("<strong>Last updated: </strong>" + patientLastUpdated.split("T")[0]))))));

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
            var qAndA = [];
            for(var i = 0; i < questionnaire.group.question.length; i++) {
                //search for validated by LinkId final answer
                var question_link_ID = questionnaire.group.question[i].linkId;
                var qr_index = -1;
                for (var x = 0; x < response.group.question.length ; x++) {
                    //console.log(question_link_ID);
                    //console.log( qr.resource.group.question[x].linkId);
                    if(question_link_ID == response.group.question[x].linkId){
                        //console.log( "validated linkId of question to a LinkID in the questionare-response");
                        qr_index = x;
                        break;
                    }
                }
                if(qr_index == -1){
                    console.log("ERROR: could not validate linkId of question to any existing LinkID in the questionare-response");
                    return;
                }
                var final_answer = response.group.question[qr_index].answer[0].valueInteger;
                qAndA.push({question:(questionnaire.group.question[i].text), answer:(questionnaire.group.question[i].option[final_answer].display), answerCode:final_answer});
            }
            var result = questionnaire_ranking(qAndA);
            console.log(result);

            var blurb_5210 = "5-2-1-0 is an evidence-based prevention message centered on recommendations for Childhood Obesity Assessment, Prevention and Treatment\
            sponsored by the Centers for Disease Control and Prevention (CDC).\
            5-2-1-0 recommends 5 or More Fruits & Vegetables a day, 2 Hours or Less of Screen Time a day, 1 Hour or More of Active Play a day, \
            and 0 Sugary Drinks a day. \
            The patient was administered the Healthy Eating Questionnaire and an analysis of the results indicates the 5-2-1-0 order of priority for this patient is as follows: ";

            theAnalysis.append($("<hr>"));
            theAnalysis.append($("<div></div>")
                .addClass("row")
                .append($("<a></a>")
                    .addClass("col-xs-9 col-xs-offset-1 text-justify btn btn-standard")
                    .attr("id", "5210 Analysis")
                    .attr("tabindex", "0")
                    .attr("role", "button")
                    .attr("data-container", "body")
                    .attr("data-toggle", "popover")
                    .attr("data-trigger", "focus")
                    .attr("data-placement", "bottom")
                    .attr("data-content", blurb_5210)
                    .popover()
                    .append($("<b></b>")
                        .html(result + "  ")
                        .popover()
                        .append($("<img>")
                            .attr("src", "img/ellipsis.png")
                            .popover()))));
            theAnalysis.append($("<hr>"));


            // theSurvey.append($("<div></div>")
            //     .addClass("row well panel-group")
            //     .attr("id", "accordion")
            //     .attr("role", "tablist")
            //     .attr("aria-multiselectable", "true")
            //     .append($("<div></div>")
            //         .addClass("panel panel-default")
            //         .append($("<div></div>")
            //             .addClass("panel-heading")
            //             .attr("role", "tab")
            //             .attr("id", "headingOne")
            //             .append($("<h4></h4>")
            //                 .addClass("panel-title")
            //                 .append($("<a></a>")
            //                     .attr("role", "button")
            //                     .attr("data-toggle", "collapse")
            //                     .attr("data-parent", "#accordion")
            //                     .attr("href", "#collapseOne")
            //                     .attr("aria-expanded", "true")
            //                     .attr("aria-controls", "collapseOne")
            //                     .html("Questionnaire Results"))))));
            // var theSurveyRow = $("<div></div>")
            //     .attr("id", "collapseOne")
            //     .addClass("panel-collapse collapse in")
            //     .attr("role", "tabpanel")
            //     .attr("aria-labelledby", "headingOne")
            //     .append($("<div></div>")
            //         .addClass("panel-body"));
            for(var i = 0; i < qAndA.length; i++) {
               var theSurveyRow = $("<div></div>")
                    .addClass("row well")
                    .append($("<div></div>")
                        .addClass("col-xs-offset-1 col-xs-3 bb text-justify")
                        .append($("<b></b>")
                            .html(qAndA[i].question)));
                theSurveyRow.append($("<div></div>")
                    .addClass("col-xs-8 bb text-justify")
                    .html(qAndA[i].answer));
                theSurvey.append(theSurveyRow);
            }

        });
    }

//------------------------------5-2-1-0-Algorithm-------------------------

    function questionnaire_ranking(qAndA)
    {

        console.log('QUESTION')
        console.log(qAndA)

        // Answers to behavior questions
        var ans_q1 = qAndA[0]['answerCode'] + 1;
        var ans_q2 = qAndA[1]['answerCode'] + 1;
        var ans_q3 = qAndA[2]['answerCode'] + 1;
        var ans_q4 = qAndA[3]['answerCode'] + 1;
        var ans_q5 = qAndA[4]['answerCode'] + 1;
        var ans_q6 = qAndA[5]['answerCode'] + 1;

        // Answers to preference questions
        var ans_q7 = qAndA[6]['answerCode'];
        var ans_q8 = qAndA[7]['answerCode'] + 1;
        var ans_q9 = qAndA[8]['answerCode'] + 1;

        // Initialize map and set to default weights

        // fd = food habits
        // s = sedentary behavior
        // p = physical activity
        // dd = drink habits

        var scores = [];
        scores['fd'] = 1;
        scores['s'] = 1;
        scores['p'] = 1;
        scores['dd'] = 1;

        // Adjust weightings based on patient's responses
        scores['fd'] = scores['fd'] * ((convertResponse(ans_q5) + ans_q2) - ans_q1) / 4;
        scores['s'] = scores['s'] * (convertResponse(ans_q6) / 4);
        scores['p'] = scores['p'] * (ans_q3 / 4);
        scores['dd'] = scores['dd'] * (ans_q4 / 4);
        console.log('SCORES')
        console.log(scores)

        // Adjust weight based on patient's preferences
        var pref_key = convertAnsToKey(ans_q7);
        var pref_score = (ans_q8 + ans_q9) / 4;
        scores[pref_key] = scores[pref_key] / pref_score;
        var focus_score = Math.floor(pref_score);

        // Sort the map by value to get the rankings for an ideal plan
        var result = Object.keys(scores).sort(function (a, b) {
            return scores[a] - scores[b];
        })

        var recomendation = [];
        for (var y = 0; y < result.length ; y++) {
            if( result[y] == 'fd' )
                recomendation[y]  =  " underconsumption of fruits and vegitables";
            if( result[y] == 's' )
                recomendation[y]  =  " too much screen time";
            if( result[y] == 'p' )
                recomendation[y]  =  " lack of active play time";
            if( result[y] == 'dd' )
                recomendation[y]  =  " overconsumption of sugary drinks";
        }
        return recomendation;
    }

    // Sometimes the responses are in reverse order so we need to covert them
    function convertResponse(resp)
    {
        return (resp*-1) + 5;
    }


    // Sloppy, but I think its more clear to keep the index's strings rather then intergers for now
    function convertAnsToKey(resp)
    {
        // Make half your plate veggies and fruits = 0
        // Be more active = 1
        // Limit screen time = 2
        // Drink more water and limit sugary drinks = 3

        if(resp == 0)
            return 'fd';
        else if(resp == 1)
            return 'p';
        else if(resp == 2)
            return 's';
        else(resp == 3)
            return 'dd';
    }

//----------------------------------------------------------------
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
