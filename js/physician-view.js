/*global
 Chart, GC, PointSet, Raphael, console, $,
 jQuery, debugLog,
 XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function(NS, $)
{

    "use strict";
    var fhir_url = window.sessionStorage.getItem('fhir_url_global')  + '/';
    var patientID = window.sessionStorage.getItem('patientid_global');

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
        return GC.App.getViewType() == "view";
    }

    function create_hhh_tbl(container) {

        var hhh_tbl = "";

        hhh_tbl += ("<div id='physician-hhh-tbl'>");
        hhh_tbl += ("<table> <tr> <th>Healthy Habit Goal</th> <th>Start Date</th> <th>End Date</th> <th>Barriers Discussed</th> </tr>");

        hhh_tbl += ("<tr> <td>Reduce Sugary Drinks</td> <td>Jan 2016</td> <td>Current</td> <td>Clark does not like the taste of water </td> </tr>");
        hhh_tbl += ("<tr> <td>Increase Fruits and Veggies</td> <td>Jun 2015</td> <td>Jan 2016</td> <td>Don't know how to cook the veggies to taste decent</td> </tr>");
        hhh_tbl += ("<tr> <td>Increased Activity</td> <td>Jun 2014</td> <td>Jun 2015</td> <td>Can't find a place to play outside</td> </tr>");

        hhh_tbl += ("</table>");
        hhh_tbl += ("</div>")

        $(container).append(hhh_tbl);
    }

    function renderPhysicianView(container) {
        $(container).empty();
        var topContainer = $("<div></div>").addClass("row");
        topContainer.attr("id", "thePatient-div");
        $(container).append(topContainer);
        var thePatient = $("<div></div>").addClass("col-xs-6 col-xs-offset-1").attr("id", "thePatientInfo-div");
        topContainer.append(thePatient);
        var patientInfo = $("<div></div>").addClass("col-xs-4");
        patientInfo.attr("id", "patientInfo-div");

        var patientCall = (function () {
            var patientCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Patient?_id=' + patientID,
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
                url: fhir_url +'QuestionnaireResponse?patient=' + patientID,
                dataType: 'json',
                success: function (data) {
                    questionnaireResponseCall = data;
                }
            });
            return questionnaireResponseCall;
        })();

        var wicQuestionnaireResponseCall = (function () {
            var wicQuestionnaireResponseCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'/QuestionnaireResponse/1081290',
                dataType: 'json',
                success: function (data) {
                    wicQuestionnaireResponseCall = data;
                }
            });
            return wicQuestionnaireResponseCall;
        })();

        var InfantQuestionsID = window.sessionStorage.getItem('infant_questions_id');
        var AdolescentQuestionsID = window.sessionStorage.getItem('adolescent_questions_id');
        //  TODO check age for correct questionnaire selection

        var questionsID = AdolescentQuestionsID;

        var questionnaireCall = (function () {
            var questionnaireCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Questionnaire?_id=' + questionsID,
                dataType: 'json',
                success: function (data) {
                    questionnaireCall = data;
                }
            });
            return questionnaireCall;
        })();

        var wicQuestionnaireCall = (function () {
            var wicQuestionnaireCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url+'/Questionnaire/1081184',
                dataType: 'json',
                success: function (data) {
                    wicQuestionnaireCall = data;
                }
            });
            return wicQuestionnaireCall;
        })();

        var theQuestionnaires = $("<div></div>").addClass("row");
        theQuestionnaires.attr("id", "theQuestionnaires-div");
        $(container).append(theQuestionnaires);

        var patientBMICall = (function () {
            var patientBMICall = null;
            //refer to http://docs.smarthealthit.org/tutorials/server-quick-start/

            //Note LOINC Codes: 39156-5 for BMI Observations
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Observation?subject:Patient=' + patientID + '&code=39156-5&_count=50',
                dataType: 'json',
                success: function (data) {
                    patientBMICall = data;
                }
            });
            return patientBMICall;
        })();

        var patientWeightCall = (function () {
            var patientWeightCall = null;
            //refer to http://docs.smarthealthit.org/tutorials/server-quick-start/

            //Note LOINC Codes: 3141-9 for Weight Observations
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Observation?subject:Patient=' + patientID + '&code=3141-9&_count=50',
                dataType: 'json',
                success: function (data) {
                    patientWeightCall = data;
                }
            });
            return patientWeightCall;
        })();

        var patientHeightCall = (function () {
            var patientHeightCall = null;
            //refer to http://docs.smarthealthit.org/tutorials/server-quick-start/

            //Note LOINC Codes: 8302-2 for Height BMI Observations
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'Observation?subject:Patient=' + patientID + '&code=8302-2&_count=50',
                dataType: 'json',
                success: function (data) {
                    patientHeightCall = data;
                }
            });
            return patientHeightCall;
        })();

        $.when(patientCall, questionnaireResponseCall, wicQuestionnaireResponseCall, questionnaireCall, patientBMICall, patientWeightCall, patientHeightCall).then(function() {

            if (patientCall.entry) {
                var patient = patientCall.entry[0].resource;
            }

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
            
            var weightUnit = "kg";
            if(patientWeightCall)
                if(patientWeightCall.entry)
                if(patientWeightCall.entry[0])
                    if(patientWeightCall.entry[0].resource)
                        if(patientWeightCall.entry[0].resource.valueQuantity)
                            weightUnit = patientWeightCall.entry[0].resource.valueQuantity.unit ? patientWeightCall.entry[0].resource.valueQuantity.unit : "";

            var heightUnit =  "cm";
            if(patientHeightCall)
                if(patientHeightCall.entry)
                if(patientHeightCall.entry[0])
                    if(patientHeightCall.entry[0].resource)
                        if(patientHeightCall.entry[0].resource.valueQuantity)
                            heightUnit = patientHeightCall.entry[0].resource.valueQuantity.unit ? patientHeightCall.entry[0].resource.valueQuantity.unit : "";

            function convertToPercent(decimal) {
                return Math.round(decimal * 100) + '%';
            }

            var height = window.sessionStorage.getItem('height_global');
            var height_per = convertToPercent(window.sessionStorage.getItem("height_per_global"));

            var weight = window.sessionStorage.getItem('weight_global');
            var weight_per = convertToPercent(window.sessionStorage.getItem("weight_per_global"));

            var BMI = window.sessionStorage.getItem('bmi_global');
            var BMI_per = convertToPercent(window.sessionStorage.getItem("bmi_per_global"));

            localStorage.setItem("BMI", BMI);
            
            thePatient.append($("<blockquote></blockquote>")
                .append($("<div></div>")
                    .addClass("patient-info")
                    .append($("<div></div>")
                        .addClass("patient-fullname")
                        .attr("id", "patient-fullname")
                        .append($("<strong></strong>")
                            .html(patientName)
                        )
                    )
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
                            .html(address)
                        )
                    )
                    .append($("<small></small>")
                        .append($("<div></div>")
                            .addClass("patient-gender text-capitalize")
                            .attr("id", "patient-gender")
                            .html("<strong>Patient ID: </strong>" + patientId)
                        )
                    )
                )
            );

            topContainer.append(patientInfo);
            patientInfo.append($("<div></div>")
                .addClass("patient-info")
                .append($("<blockquote></blockquote>")
                    .addClass("blockquote-reverse")
                    .append($("<div></div>")
                        .addClass("patient-gender text-capitalize")
                        .attr("id", "patient-gender")
                        .html("<strong>Gender: </strong>" + patientGender)
                    )
                    .append($("<div></div>")
                        .addClass("patient-bday dt")
                        .attr("id", "patient-bday")
                        .html("<strong>Birthdate: </strong>" + patientBDay)
                    )
                    .append($("<div></div>")
                        .addClass("patient-BMI")
                        .attr("id", "patient-BMI")
                        .html("<strong>BMI: </strong>" + BMI + " (" + BMI_per + ")")
                    )
                    .append($("<div></div>")
                        .addClass("patient-weight")
                        .attr("id", "patient-weight")
                        .html("<strong>Weight: </strong>" + weight + " " + weightUnit + " (" + weight_per + ")")
                    )
                    .append($("<div></div>")
                        .addClass("patient-height")
                        .attr("id", "patient-height")
                        .html("<strong>Height: </strong>" + height + " " + heightUnit + " (" + height_per + ")")
                    )
                )
            );

            create_hhh_tbl(container);

            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
            var hhLastUpdated = new Date(questionnaireResponseCall.entry[0].resource.authored ? questionnaireResponseCall.entry[0].resource.authored : "-");

            if (!isNaN(hhLastUpdated)) {
                theQuestionnaires.append($("<div></div>")
                    .attr("id", "healthyHabits-div")
                    .addClass("col-xs-5 col-xs-offset-1 text-center")
                    .append($("<a></a>")
                        .attr("id", "view-HHQuestionnaireAndResponse")
                        .append($("<h3></h3>")
                            .html("Healthy Habits Assessment Response <br>")
                        )
                        .append($("<p></p>")
                            .html("Updated " + months[hhLastUpdated.getMonth()] + " " + hhLastUpdated.getDate() + ", " + hhLastUpdated.getFullYear())
                        )
                        .append($("<p></p>")
                            .html("click to see results ->")
                        )
                    )
                );
            } else {
                theQuestionnaires.append($("<div></div>")
                    .attr("id", "healthyHabits-div")
                    .addClass("col-xs-5 col-xs-offset-1 text-center")
                    .append($("<h3></h3>")
                        .html("Healthy Habits Assessment Response <br>")
                    )
                    .append($("<p></p>")
                        .html("The patient has not completed the Healthy Eating Survey")
                    )
                );
            }

            theQuestionnaires.append($("<div></div>")
                .attr("id", "wic-div")
                .addClass("col-xs-offset-6 text-center")
                .append($("<a></a>")
                    .attr("id", "view-WICQuestionnaireAndResponse")
                    .append($("<h3></h3>")
                        .html("WIC Questionnaire Response <br>")
                    )
                    .append($("<p></p>")
                        .html(" Updated <b>*** WILL FIX LATER ***</b>")
                    )
                    .append($("<p></p>")
                        .html("click to see results ->")
                    )
                )
            );

            $("#dialog").dialog({ autoOpen: false, height: 500, width: 1000, overflow: scroll });
            $("#view-HHQuestionnaireAndResponse").click(function() {

                $("#dialog").empty();

                var theSurvey = $("<div></div>").addClass("col-xs-10 col-xs-offset-1");
                theSurvey.attr("id", "theSurvey-div");
                $("#dialog").append(theSurvey);
                if (questionnaireCall.entry) {
                    var questionnaire = questionnaireCall.entry[0].resource;
                }
                if (questionnaireResponseCall.entry) {
                    var response = questionnaireResponseCall.entry[0].resource;
                }

                var questionnaireId = "";
                if (questionnaire) {
                    questionnaireId = (questionnaire.id ? questionnaire.id : "");
                }

                var questionnaireVersion = "";
                var questionnaireLastUpdated = "";

                if (questionnaire) {
                    if(questionnaire.meta){
                        questionnaireVersion = (questionnaire.meta.versionId ? questionnaire.meta.versionId : "");
                        questionnaireLastUpdated = (questionnaire.meta.lastUpdated ? questionnaire.meta.lastUpdated.split("T")[0] : "");
                    }
                }
                var responseLastUpdated = "";
                if(response)
                {
                    var responseAuthored = new Date(response.authored ? response.authored : "-");
                    if(response.meta){
                        responseLastUpdated = (response.meta.lastUpdated ? response.meta.lastUpdated.split("T") : "");
                    }
                    var qAndA = [];
                    for(var i = 0; i < questionnaire.group.question.length; i++) {
                        //search for validated by LinkId final answer
                        var question_link_ID = questionnaire.group.question[i].linkId;
                        var qr_index = -1;
                        for (var x = 0; x < response.group.question.length ; x++) {
                            if(question_link_ID == response.group.question[x].linkId){
                                qr_index = x;
                                break;
                            }
                        }
                        if(qr_index == -1){
                            console.log("ERROR: could not validate linkId of question to any existing LinkID in the questionnaire-response");
                            return;
                        }
                        var final_answer = response.group.question[qr_index].answer[0].valueInteger - 1;
                        qAndA.push({question:(questionnaire.group.question[qr_index].text), answerCode:final_answer});
                    }

                    theSurvey.append($("<div></div>")
                        .html("<hr>")
                        .append($("<h1></h1>")
                            .addClass("text-center text-muted btn-group-sm")
                            .html("Healthy habits questionnaire responses")
                        )
                    );

                    for(var i = 0; i < questionnaire.group.question.length; i++) {
                        var options = [];
                        for(var j = 0; j < questionnaire.group.question[i].option.length; j++) {
                            options.push(questionnaire.group.question[i].option[j].display);
                        }
                        var surveyRow = $("<div></div>")
                            .addClass("btn-group")
                            .attr("data-toggle", "buttons")
                            .attr("role", "group");
                        for (var j = 0; j < options.length; j++) {
                            if (qAndA[i].answerCode == j) {
                                surveyRow.append($("<div></div>")
                                    .addClass("btn-group btn-group-sm")
                                    .attr("role", "group")
                                    .append($("<a></a>")
                                        .addClass("btn btn-default btn-responsive active disabled")
                                        .attr("type", "button")
                                        .html(options[j])
                                    )
                                );
                            }
                            else {
                                surveyRow.append($("<div></div>")
                                    .addClass("btn-group btn-group-sm")
                                    .attr("role", "group")
                                    .append($("<a></a>")
                                        .addClass("btn btn-default btn-responsive disabled")
                                        .attr("type", "button")
                                        .html(options[j])
                                    )
                                );
                            }
                        }
                        theSurvey.append($("<div></div>")
                            .addClass("row well")
                            .append($("<div></div>")
                                .addClass("text-center text-muted")
                                .append($("<h4></h4>")
                                    .html(qAndA[i].question)
                                )
                            )
                            .append($("<div></div>")
                                .append(surveyRow)
                            )
                        );
                    }
                }
                else {
                    $("#dialog").append("<div id='physician-questionnaire-blank'>The patient has not completed the Healthy Eating Survey.</div>");
                }

                $("#dialog").dialog("open");
            });

            $("#dialog").dialog({ autoOpen: false, height: 500, width: 1000, overflow: scroll });
            $("#view-WICQuestionnaireAndResponse").click(function() {

                $("#dialog").empty();

                if (questionnaireResponseCall.entry) {
                    var response = questionnaireResponseCall.entry[0].resource;
                }

                var wicSurvey = $("<div></div>").addClass("col-xs-10 col-xs-offset-1");
                wicSurvey.attr("id", "wicSurvey-div");
                $("#dialog").append(wicSurvey);

                wicSurvey.append($("<div></div>")
                    .html("<hr>")
                    .append($("<h1></h1>")
                        .addClass("text-center text-muted btn-group-sm")
                        .html("WIC Questionnaire Response")
                    )
                );
                if (wicQuestionnaireCall.group && wicQuestionnaireResponseCall.group) {

                    var wicQuestionnaire = wicQuestionnaireCall.group.group;
                    var linkId;
                    var questionGroups = [];
                    var hasSubQuestions;
                    var subQuestionLinkId;
                    var subQuestionType;
                    var subQuestionAsked;
                    var subQuestionAnswer;
                    var subQuestionAnswerChoices = [];
                    var subQuestionAnsweredType;
                    var wicQRLinkID;
                    var wicSubQRLinkID;
                    var wicQAndA = [];

                    var wicQuestionnaireResponse = wicQuestionnaireResponseCall.group.group;

                    var wicQRIndex = -1;
                    for (var i = 0; i < wicQuestionnaire.length; i++) {
                        linkId = wicQuestionnaire[i].linkId
                        for (var j = 0; j < wicQuestionnaireResponse.length; j++) {
                            wicQRLinkID = wicQuestionnaireResponse[j].linkId;
                            if (linkId == wicQRLinkID) {
                                wicQRIndex = j;
                                break;
                            }
                        }
                        if (wicQRIndex == -1) {
                            console.log("ERROR: could not validate linkId of question to any existing LinkID in the wic-questionnaire-response");
                            return;
                        }

                        questionGroups.push(wicQuestionnaire[wicQRIndex].text);

                        var wicSubQRIndex = -1;
                        for (var j = 0; j < wicQuestionnaire[wicQRIndex].question.length; j++) {
                            subQuestionLinkId = wicQuestionnaire[wicQRIndex].question[j].linkId;
                            for (var k = 0; k < wicQuestionnaireResponse[wicQRIndex].question.length; k++) {
                                wicSubQRLinkID = wicQuestionnaire[wicQRIndex].question[k].linkId;
                                if (subQuestionLinkId === wicSubQRLinkID) {
                                    wicSubQRIndex = k;
                                    break;
                                }
                            }
                            if (wicSubQRIndex == -1) {
                                console.log("ERROR: could not validate linkId of sub-question to any existing LinkID in the wic-questionnaire-response");
                                return;
                            }

                            var codes = [];
                            var options = [];
                            subQuestionType = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].type;
                            var id = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].linkId;
                            switch (true) {
                                case (subQuestionType === "boolean"):
                                    for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                        codes.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].code);
                                        options.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].display);
                                    }
                                    subQuestionAnswerChoices.push({
                                        ID: id,
                                        answerCode: codes,
                                        answerOption: options
                                    });
                                    break;
                                case (subQuestionType === "text"):
                                    subQuestionAnswerChoices.push({
                                        ID: wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].linkId,
                                        answerCode: "",
                                        answerOption: ""
                                    });
                                    break;
                                case (subQuestionType === "integer"):
                                    for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                        for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                            codes.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].code);
                                            options.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].display);
                                        }
                                        subQuestionAnswerChoices.push({
                                            ID: id,
                                            answerCode: codes,
                                            answerOption: options
                                        });
                                    }
                                    break;
                                default:
                                // subQuestionAnswerChoices.push({
                                //     ID: wicSubQRIndex,
                                //     answerCode: "",
                                //     answerOption: ""
                                // });
                            }


                            subQuestionLinkId = wicQuestionnaireResponse[wicQRIndex].question[wicSubQRIndex].linkId;
                            subQuestionAsked = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].text;
                            subQuestionAnsweredType = wicQuestionnaireResponse[wicQRIndex].question[wicSubQRIndex].answer[0];
                            subQuestionType;
                            if (subQuestionAnsweredType.valueBoolean !== undefined) {
                                subQuestionAnswer = subQuestionAnsweredType.valueBoolean;
                                subQuestionType = "boolean";
                                wicQAndA.push({
                                    ID: subQuestionLinkId,
                                    question: subQuestionAsked,
                                    answer: subQuestionAnswer,
                                    type: subQuestionType
                                });
                            } else if (subQuestionAnsweredType.valueString !== undefined) {
                                subQuestionAnswer = subQuestionAnsweredType.valueString;
                                subQuestionType = "text";
                                wicQAndA.push({
                                    ID: subQuestionLinkId,
                                    question: subQuestionAsked,
                                    answer: subQuestionAnswer,
                                    type: subQuestionType
                                });
                            } else if (subQuestionAnsweredType.valueInteger !== undefined) {
                                    subQuestionAnswer = subQuestionAnsweredType.valueInteger;
                                    subQuestionType = "integer";
                                    wicQAndA.push({
                                        ID: subQuestionLinkId,
                                        question: subQuestionAsked,
                                        answer: subQuestionAnswer,
                                        type: subQuestionType
                                    });
                                }
                        }
                    }
                    console.log(wicQAndA);
                    console.log(subQuestionAnswerChoices);
                    var wicSurveyRow = $("<div></div>")
                        .addClass("btn-group")
                        .attr("data-toggle", "buttons")
                        .attr("role", "group");
                    for (var i = 0; i < wicQAndA.length; i++) {
                        for (var j = 0; j < subQuestionAnswerChoices.lenght; j++) {
                            if (wicQAndA[i].ID === subQuestionAnswerChoices[j].ID) {
                                wicSurveyRow.append($("<div></div>")
                                    .addClass("text-center text-muted")
                                    .append($("<p></p>")
                                        alert(wicQAndA[i].question)
                                        .html(wicQAndA[i].question)
                                    )
                                )
                            }
                        }
                    }
                    for (var i = 0; i < questionGroups.length; i++) {
                        wicSurvey.append($("<div></div>")
                            .addClass("row well")
                            .append($("<div></div>")
                                .addClass("text-center text-muted")
                                .append($("<p></p>")
                                    .attr("font", "8px")
                                    .html(questionGroups[i])
                                )
                            )
                            .append($("<div></div>")
                                .html(wicSurveyRow)
                            )
                        );
                    }






                    /*for(var i = 0; i < questionnaire.group.question.length; i++) {
                        var options = [];
                        for(var j = 0; j < questionnaire.group.question[i].option.length; j++) {
                            options.push(questionnaire.group.question[i].option[j].display);
                        }
                        var surveyRow = $("<div></div>")
                            .addClass("btn-group")
                            .attr("data-toggle", "buttons")
                            .attr("role", "group");
                        for (var j = 0; j < options.length; j++) {
                            if (qAndA[i].answerCode == j) {
                                surveyRow.append($("<div></div>")
                                    .addClass("btn-group btn-group-sm")
                                    .attr("role", "group")
                                    .append($("<a></a>")
                                        .addClass("btn btn-default btn-responsive active disabled")
                                        .attr("type", "button")
                                        .html(options[j])
                                    )
                                );
                            }
                            else {
                                surveyRow.append($("<div></div>")
                                    .addClass("btn-group btn-group-sm")
                                    .attr("role", "group")
                                    .append($("<a></a>")
                                        .addClass("btn btn-default btn-responsive disabled")
                                        .attr("type", "button")
                                        .html(options[j])
                                    )
                                );
                            }
                        }
                        theSurvey.append($("<div></div>")
                            .addClass("row well")
                            .append($("<div></div>")
                                .addClass("text-center text-muted")
                                .append($("<h4></h4>")
                                    .html(qAndA[i].question)
                                )
                            )
                            .append($("<div></div>")
                                .append(surveyRow)
                            )
                        );
                    }*/
                }


                else {
                    $("#dialog").append("<div id='physician-questionnaire-blank'>The patient has not completed the WIC questionnaire.</div>");
                }
                $("#dialog").dialog("open");
            });
        });
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
