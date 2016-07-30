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
        hhh_tbl += ("</div>");

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

        var InfantQuestionsID = window.sessionStorage.getItem('infant_questions_id');
        var AdolescentQuestionsID = window.sessionStorage.getItem('adolescent_questions_id');
        var questionsID = InfantQuestionsID;

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
                url: fhir_url + 'QuestionnaireResponse?patient=' + patientID + "&questionnaire=" + questionsID + "&_sort:desc=authored",
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
                url: fhir_url + 'Questionnaire/1081184',
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

        $.when(patientCall, questionnaireResponseCall, wicQuestionnaireResponseCall, questionnaireCall, patientWeightCall, patientHeightCall).then(function() {

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

            var graph_str   ='                                                                                                               '
                +'        <style>  '
                +'   .row-eq-height { display: -webkit-box; display: -webkit-flex; display: -ms-flexbox; display:         flex;}'
                +'        </style>                                                                                                   '

                +'        <h2  align="center">Health Habit Item: Progress History</h2>                                           '
                +'        <div class="container" id="historyGraphDiscuss">                                                       '
                +'            <div class="row">                                                                                  '
                +'                 <div class="col-sm-8" id="graph_div"></div>       '
                +'                 <div class="col-sm-2" id="graph_key_div" style="border:1px solid black"></div>       '
                +'                 <div class="col-sm-2" id="wants_to_discuss_div"></div>                                   '
                +'            </div>                                                                                             '
                +'        </div><p> </p>                                                                                             ';

            $(container).append(graph_str);

            create_hhh_tbl(container);
            /*****************************  graphs **************************/

            //region create_graph
            function create_graph( Question, key_word, answer_date , multiple_choices)
            {
                var key_class= "key_class_" + key_word;

                //append the keyword to the graph key
                $( graph_key_div ).append( '<h3 class="' + key_class +'"><font color="blue">'+ key_word +'</font></h3> <p> </p>'  );

                var margin = 30;
                var left_margin = 180; //size should be calculated the longest string in all the multiple_choices
                var right_margin = 30; //size should be calculated to be as long as a date of the authored feild

                var canvas_id= "canvas_" + key_word;

                $( graph_div ).append( '<canvas id="' + canvas_id + '" height="400" width="750" style="border:1px solid #000000;" ></canvas>'  );

                var canvas = document.getElementById(canvas_id);
                var context = canvas.getContext("2d");

                context.font = "bold 13px Verdana"
                context.fillText(Question, margin , margin );

                context.font = "10px Verdana"

                //draw and label the row grid lines
                context.strokeStyle="#009933"; // color of grid lines

                var number_of_rows = multiple_choices.length;
                var yStep = (canvas.height - margin ) / number_of_rows;

                context.beginPath();
                for (var row_count = 0; row_count < number_of_rows; row_count++)
                {
                    var y =  (canvas.height - margin) - (row_count * yStep) ;
                    context.fillText(multiple_choices[row_count], margin, y );
                    context.moveTo(left_margin ,y);
                    context.lineTo(canvas.width,y);
                }
                context.stroke();

                // print dates on X axis every 3 months
                //1. convert newest and oldest dates into miliseconds
                var ms_in_3_months = (1000 * 60 * 60 * 24 * 30 *3);
                var oldestDate = answer_date[  answer_date.length -1   ].authored;
                var oldestTime = new Date(oldestDate);
                var newestDate = answer_date[0].authored;
                var newestTime = new Date(newestDate);
                var diff_max = newestTime.getTime() - oldestTime.getTime();  //ms of span from oldest date to newest date
                var diff_max_3_month_periods = diff_max / ms_in_3_months;
                var length_x_axis = canvas.width - left_margin - right_margin;
                var section_length = length_x_axis / diff_max_3_month_periods;

                for (var i = 0; i < diff_max_3_month_periods; i++)
                {
                    var d_time = oldestTime.getTime()  + (ms_in_3_months * i );
                    var d      = new Date(d_time);
                    var d_display = (d.getMonth() + 1 ) + "/" + d.getFullYear() ;
                    var x = left_margin + i * section_length;

                    context.fillText( d_display , x , (canvas.height -margin/2 ));
                }

                var x_y = [];

                // calculate the iregular interval on x axis
                //1. convert newest and oldest dates into miliseconds and figure out time span
                var oldestDate = answer_date[  answer_date.length -1   ].authored;
                var oldestTime = new Date(oldestDate);
                var newestDate = answer_date[0].authored;
                var newestTime = new Date(newestDate);
                var diff_max = newestTime.getTime() - oldestTime.getTime();  //ms of span from oldest date to newest date
                var length_x_axis = canvas.width - left_margin - right_margin;

                for (var i = 0; i < answer_date.length; i++)
                {
                    var currDate = answer_date[ i  ].authored;
                    var currTime = new Date(currDate);
                    var diff_to_curr = currTime.getTime() - oldestTime.getTime();
                    var frac_of_span = diff_to_curr /diff_max;
                    var X = (length_x_axis * frac_of_span) + left_margin;

                    var Y  = (canvas.height - margin) - ((answer_date[ i ].answer -1) * yStep) ;

                    x_y.push({ x:X , y:Y});

                    // draw the circles
                    context.fillStyle = "rgba(255, 255, 0, .5)";  //yellow
                    context.strokeStyle="#000000";
                    context.beginPath();
                    context.arc(X,Y,10,0,2*Math.PI);
                    context.closePath();
                    context.fill();
                    context.lineTo(X.Y ,y)
                    context.stroke();
                }

                //draw line on graph
                context.lineWidth=2;
                context.beginPath();
                context.moveTo(x_y[0].x,x_y[0].y)  ;
                for (var i = 1; i < answer_date.length; i++)
                {
                    context.lineTo(x_y[i].x,x_y[i].y);

                }
                context.stroke();
            }
            //endregion

            //region all graphs
            //$( wants_to_discuss_div).html(  '<h3> Patient wants to discuss the following Healthy Habit: </h3> <h3> Barriers faced by patient: </h3>');
            $( graph_key_div ).append( '<h3> Click on Healthy Habit to see change over time: </h3>  <p> </p>'  );

            var answer_date = [];
            var multiple_choices = [];
            var Question = '';
            var Response = '';
            var Answer = '';
            var Authored = '';
            var questionnaire = '';

            if (questionnaireCall.entry && questionnaireResponseCall.entry)
            {
                questionnaire = questionnaireCall.entry[0].resource;

                for(var q = 0; q < questionnaire.group.question.length; q++)
                    //for(var q = 0; q < 1; q++)
                {
                    Question = questionnaire.group.question[q].text

                    var graph_question = "";
                    var want_graph = false;

                    //only let through the questions about "veggies and fruits", "active", "fruit juice", "sweet drinks", "television"

                    var KeyWord = 'veggies and fruits';
                    var want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);

                    if(want_graph == false)
                    {
                        KeyWord = 'active';
                        want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                    }

                    if(want_graph == false)
                    {
                        KeyWord = 'fruit juice';
                        want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                    }

                    if(want_graph == false)
                    {
                        KeyWord = 'sweet drinks';
                        want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                    }

                    if(want_graph == false)
                    {
                        KeyWord = 'foods';
                        want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                    }

                    if(want_graph == false)
                    {
                        KeyWord = 'television';
                        want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                        KeyWord = 'screen time';
                    }

                    if(want_graph == true )
                    {
                        multiple_choices = [];
                        for(var j = 0; j < questionnaire.group.question[q].option.length; j++)
                        {
                            multiple_choices.push(questionnaire.group.question[q].option[j].display);
                        }

                        answer_date = [];
                        for(var  qr = 0; qr < questionnaireResponseCall.entry.length; qr++)
                        {
                            Response   =   questionnaireResponseCall.entry[ qr ].resource;
                            Answer     =   Response.group.question[ q ].answer[0].valueInteger;
                            Authored   =   Response.authored.split("T")[ 0 ] ;
                            answer_date.push({ answer:Answer, authored:Authored});
                        }

                        create_graph(Question, KeyWord, answer_date, multiple_choices ) ;
                    }
                }
            }
            //endregion

            /***************************** end  graphs **************************/

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

            $("#dialog").dialog({ autoOpen: false, height: 600, width: 1150, overflow: scroll });
            $("#view-WICQuestionnaireAndResponse").click(function() {

                $("#dialog").empty();

                var wicSurvey = $("<div></div>").addClass("col-xs-12");
                wicSurvey.attr("id", "wicSurvey-div");
                $("#dialog").append(wicSurvey);

                if (questionnaireResponseCall.entry) {
                    var response = questionnaireResponseCall.entry[0].resource;
                }

                if (wicQuestionnaireCall.group && wicQuestionnaireResponseCall.group) {

                    var wicQuestionnaire = wicQuestionnaireCall.group.group;
                    var linkId;
                    var questionGroups = [];
                    var subQuestionLinkId;
                    var subQuestionGroupID;
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

                        questionGroups.push({groupID:wicQuestionnaire[wicQRIndex].linkId, Topic:wicQuestionnaire[wicQRIndex].text});

                        var wicSubQRIndex = -1;
                        for (var j = 0; j < wicQuestionnaire[wicQRIndex].question.length; j++) {
                            subQuestionLinkId = wicQuestionnaire[wicQRIndex].question[j].linkId;
                            for (var k = 0; k < wicQuestionnaireResponse[wicQRIndex].question.length; k++) {
                                wicSubQRLinkID = wicQuestionnaire[wicQRIndex].question[k].linkId;
                                if (subQuestionLinkId == wicSubQRLinkID) {
                                    wicSubQRIndex = k;
                                    break;
                                }
                            }
                            if (wicSubQRIndex == -1) {
                                console.log("ERROR: could not validate linkId of sub-question to any existing LinkID in the wic-questionnaire-response");
                                return;
                            }

                            //region wicQandA
                            var codes = [];
                            var options = [];
                            var answer;
                            var id = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].linkId;
                            var groupID = wicQuestionnaire[wicQRIndex].linkId;
                            var questionType = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].type;
                            subQuestionLinkId = wicQuestionnaireResponse[wicQRIndex].question[wicSubQRIndex].linkId;
                            subQuestionGroupID = wicQuestionnaireResponse[wicQRIndex].linkId;
                            var questionAsked = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].text;
                            var questionResponseType = wicQuestionnaireResponse[wicQRIndex].question[wicSubQRIndex].answer[0];

                            if (questionType == "boolean" && questionResponseType.valueBoolean !== undefined && id == subQuestionLinkId) {
                                for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                    codes.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].code);
                                    options.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].display);
                                }
                                answer = questionResponseType.valueBoolean;
                                wicQAndA.push({
                                    ID: id,
                                    groupID: groupID,
                                    question: questionAsked,
                                    answer: answer,
                                    responseChoices: options,
                                    responseChoiceCodes: codes,
                                    responseType: questionType
                                });
                            }
                            if (questionType == "text" && questionResponseType.valueString !== undefined && id == subQuestionLinkId) {
                                answer = questionResponseType.valueString;
                                wicQAndA.push({
                                    ID: id,
                                    groupID: groupID,
                                    question: questionAsked,
                                    answer: answer,
                                    responseChoices: "",
                                    responseChoiceCodes: "",
                                    responseType: questionType
                                });
                            }
                            if (questionType == "integer" && questionResponseType.valueInteger !== undefined && id == subQuestionLinkId ) {
                                for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                    for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                        codes.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].code);
                                        options.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].display);
                                    }
                                    answer = questionResponseType.valueInteger;
                                    wicQAndA.push({
                                        ID: id,
                                        groupID: groupID,
                                        question: questionAsked,
                                        answer: answer,
                                        responseChoices: options,
                                        responseChoiceCodes: codes,
                                        responseType: questionType
                                    });
                                }
                            }
                            //endregion
                        }
                    }

                    wicSurvey.append($("<div></div>")
                        .html("<hr>")
                        .attr("id", "wic-questionnaire-title-div") 
                        .append($("<h1></h1>") 
                            .addClass("text-center text-muted btn-group-sm") 
                            .html("WIC Questionnaire Response") 
                        ) 
                    );  
                    var leftDiv = $("<div></div>") 
                        .addClass("col-xs-5 form-group") 
                        .attr("id", "leftDiv");

                    var rightDiv = $("<div></div>")
                        .addClass("col-xs-offset-7 form group")
                        .attr("id", "rightDiv");

                    var linkID1Form = $("<form></form>") 
                        .addClass("row col-xs-12 form-horizontal") 
                        .attr("role", "form");

                    var linkID2Form = $("<form></form>")
                        .addClass("row form horizontal")
                        .attr("role", "form");

                    var linkID2SelectorDiv = $("<div></div>")
                        .addClass("form-group col-xs-6");

                    var linkID2Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px");

                    var linkID3Form = $("<form></form>");

                    var linkID4Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID5Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID6Form = $("<form></form>")
                        .addClass("row form horizontal")
                        .attr("role", "form");

                    var linkID6SelectorDiv = $("<div></div>")
                        .addClass("form-group col-xs-6");

                    var linkID6Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px");

                    var linkID7Form = $("<form></form>")
                        .addClass("row form horizontal")
                        .attr("role", "form");

                    var linkID7SelectorDiv = $("<div></div>")
                        .addClass("form-group");

                    var linkID7Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px")
                        .css("width", "100%");

                    var linkID8Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID9Form = $("<div></div>")
                        .addClass("form-group row");

                    for (var i = 0; i < questionGroups.length; i++) { 
                        for (var j = 0; j < wicQAndA.length; j++) { 

                            //region LinkID1
                            if (questionGroups[i].groupID == 1 && wicQAndA[j].groupID == 1) {
                                    if (wicQAndA[j].responseType == "boolean") {
                                        var questionID = parseFloat(wicQAndA[j].ID).toFixed(1);

                                        var linkID1Title = $("<div></div>")
                                            .attr("id", "linkID1-title-div")
                                            .append($("<h4></h4>")
                                                .html(questionGroups[i].Topic)
                                            );
                                        var _linkID1 = $("<div></div>")
                                            .addClass("checkbox")
                                            .append($("<input>")
                                                .attr("id", "linkID: " + wicQAndA[j].ID)
                                                .attr("type", "checkbox")
                                                .attr("disabled", true)
                                                .prop("checked", wicQAndA[j].answer)
                                                .css("padding", "1px")
                                                .css("width", "60px")
                                                .css("height", "30px")
                                            )
                                            .append($("<p></p>")
                                                .css("padding", "5px 3px 0px 55px")
                                                .attr("id", "linkID: " + wicQAndA[j].ID)
                                                .html(wicQAndA[j].question)
                                            );
                                    }
                                    if (wicQAndA[j].responseType == "text") {
                                        var answerID =  wicQAndA[j].ID;
                                        var _linkID1a = $("<textarea></textarea>")
                                            .addClass("form-control")
                                            .attr("disabled", true)
                                            .attr("placeholder", wicQAndA[j].answer)
                                            .css("margin-left", "30px")
                                            .css("height", "20px");
                                    }
                                    var adjustedQuestionID = (Number(questionID)+0.1).toFixed(parseInt(1));

                                    if (Number(answerID) == adjustedQuestionID) {
                                        _linkID1.append(_linkID1a);
                                    }
                                }
                                linkID1Form.append(_linkID1);
                            //endregion

                            //region LinkID2

                            if (questionGroups[i].groupID == 2 && wicQAndA[j].groupID == 2) {

                                var linkID2Title = $("<div></div>")
                                    .attr("id", "linkID2-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                if (wicQAndA[j].responseType == "boolean") {
                                    for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                        var _linkID2 = $("<option></option>")
                                            .addClass("form-control")
                                            .attr("multiple", "")
                                            .prop("selected", wicQAndA[j].answer)
                                            .attr("disabled", "disabled")
                                            .css("border", "0px")
                                            .css("outline", "0px")
                                            .css("width", "80%")
                                            .html(wicQAndA[j].question);
                                    }
                                }
                                if (wicQAndA[j].responseType == "text") {
                                    var _linkID2Text = $("<div></div>")
                                        .addClass("form-group col-xs-offset-7")
                                        .append($("<label></label>")
                                            .attr("for", "other")
                                            .html(wicQAndA[j].question)
                                            .append($("<textarea></textarea>")
                                                .addClass("form-control")
                                                .attr("rows", "7")
                                                .attr("id", "other")
                                                .attr("placeholder", wicQAndA[j].answer)
                                                .attr("disabled", true)
                                            )
                                        );
                                }
                            }
                            linkID2Selector.append(_linkID2);
                            linkID2SelectorDiv.append(linkID2Selector);
                            linkID2Form.append(linkID2SelectorDiv);
                            linkID2Form.append(_linkID2Text);
                            //endregion

                            //region LinkID3

                            if(questionGroups[i].groupID == 3 && wicQAndA[j].groupID == 3) {
                                var linkID3Title = $("<div></div>")
                                    .attr("id", "linkID3-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID3 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID3Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .addClass("form-group")
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "selected-choice")
                                            .attr("for", "linkID3Radio" + wicQAndA[j].ID +"selected")
                                            .html(wicQAndA[j].responseChoices[0])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"selected")
                                                .prop("checked", true)
                                            )
                                        )
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "selected-choice")
                                            .attr("for", "linkID3Radio"+wicQAndA[j].ID+"notselected")
                                            .html(wicQAndA[j].responseChoices[1])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"selected")
                                            )
                                        );
                                } else {
                                    linkID3Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .addClass("form-group")
                                            .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "notselected-choice")
                                            .attr("for", "linkID3Radio" + wicQAndA[j].ID +"notselected")
                                            .html(wicQAndA[j].responseChoices[0])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"notselected")
                                            )
                                        )
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "selected-choice")
                                            .attr("for", "linkID3Radio"+wicQAndA[j].ID+"selected")
                                            .html(wicQAndA[j].responseChoices[1])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"selected")
                                                .prop("checked", true) //FIX ME
                                            )
                                        );
                                }
                                    _linkID3.append(linkID3Radio);
                            }
                                linkID3Form.append(_linkID3);
                            //endregion

                            //region LinkID4
                            if (questionGroups[i].groupID == 4 && wicQAndA[j].groupID == 4) {
                                var linkID4Title = $("<div></div>")
                                    .attr("id", "linkID4-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID4 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID4Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID4Radio" + wicQAndA[j].ID +"selected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID4Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID4Radio"+wicQAndA[j].ID+"notselected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                    .append($("<input>")
                                                        .addClass("form-check-input")
                                                        .attr("type","radio")
                                                        .attr("disabled", true)
                                                        .attr("name", "inlineRadioOptions")
                                                        .attr("id", "linkID4Radio" + wicQAndA[j].ID+"notselected")
                                                    )
                                            )
                                        );
                                } else {
                                    linkID4Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID4Radio" + wicQAndA[j].ID +"notselected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID4Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID4Radio"+wicQAndA[j].ID+"selected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                    .append($("<input>")
                                                        .addClass("form-check-input")
                                                        .attr("type","radio")
                                                        .attr("disabled", true)
                                                        .attr("name", "inlineRadioOptions")
                                                        .attr("id", "linkID4Radio" + wicQAndA[j].ID+"selected")
                                                        .prop("checked", true)
                                                    )
                                            )
                                        );
                                }
                                _linkID4.append(linkID4Radio);
                            }
                            linkID4Form.append(_linkID4);
                            //endregion

                            //region LinkID5
                            if (questionGroups[i].groupID == 5 && wicQAndA[j].groupID == 5) {
                                var linkID5Title = $("<div></div>")
                                    .attr("id", "linkID5-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID5 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");


                                if (wicQAndA[j].answer == 1) {
                                    var linkID5Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID5Radio" + wicQAndA[j].ID +"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else if (wicQAndA[j].answer == 2){
                                    linkID5Radio =  $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio" + wicQAndA[j].ID +"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else if (wicQAndA[j].answer == 3) {
                                    linkID5Radio =  $("<div></div>")
                                        .attr("id", "third-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio" + wicQAndA[j].ID +"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID5.append(linkID5Radio);
                            }
                            linkID5Form.append(_linkID5);
                            //endregion

                            //region LinkID6
                            if (questionGroups[i].groupID == 6 && wicQAndA[j].groupID == 6) {

                                var linkID6Title = $("<div></div>")
                                    .attr("id", "linkID6-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                if (wicQAndA[j].responseType == "boolean") {
                                    for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                        var _linkID6 = $("<option></option>")
                                            .addClass("form-control")
                                            .attr("multiple", "")
                                            .prop("selected", wicQAndA[j].answer)
                                            .attr("disabled", "disabled")
                                            .css("border", "0px")
                                            .css("outline", "0px")
                                            .css("width", "80%")
                                            .html(wicQAndA[j].question);
                                    }
                                }
                                if (wicQAndA[j].responseType == "text") {
                                    var _linkID6Text = $("<div></div>")
                                        .addClass("form-group col-xs-offset-7")
                                        .append($("<label></label>")
                                            .attr("for", "other")
                                            .html(wicQAndA[j].question)
                                            .append($("<textarea></textarea>")
                                                .addClass("form-control")
                                                .attr("rows", "7")
                                                .attr("id", "other")
                                                .attr("placeholder", wicQAndA[j].answer)
                                                .attr("disabled", true)
                                            )
                                        );
                                }
                            }
                            linkID6Selector.append(_linkID6);
                            linkID6SelectorDiv.append(linkID6Selector);
                            linkID6Form.append(linkID6SelectorDiv);
                            linkID6Form.append(_linkID6Text);
                            //endregion

                            //region LinkID7
                            if (questionGroups[i].groupID == 7 && wicQAndA[j].groupID == 7) {

                                var linkID7Title = $("<div></div>")
                                    .attr("id", "linkID7-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                    var _linkID7 = $("<option></option>")
                                        .addClass("form-control text-center")
                                        .attr("multiple", "")
                                        .prop("selected", wicQAndA[j].answer)
                                        .attr("disabled", "disabled")
                                        .css("border", "0px")
                                        .css("outline", "0px")
                                        .css("width", "80%")
                                        .html(wicQAndA[j].question);
                                }
                            }
                            linkID7Selector.append(_linkID7);
                            linkID7SelectorDiv.append(linkID7Selector);
                            linkID7Form.append(linkID7SelectorDiv);
                            //endregion

                            //region linkID8
                            if (questionGroups[i].groupID == 8 && wicQAndA[j].groupID == 8) {
                                var linkID8Title = $("<div></div>")
                                    .attr("id", "linkID8-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID8 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID8Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID8Radio" + wicQAndA[j].ID +"selected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID8Radio"+wicQAndA[j].ID+"notselected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else {
                                    linkID8Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID8Radio" + wicQAndA[j].ID +"notselected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID8Radio"+wicQAndA[j].ID+"selected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID8.append(linkID8Radio);
                            }
                            linkID8Form.append(_linkID8);
                            //endregion

                            //region linkID9
                            if (questionGroups[i].groupID == 9 && wicQAndA[j].groupID == 9) {
                                var linkID9Title = $("<div></div>")
                                    .attr("id", "linkID4-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var linkID9 = $("<label></label>")
                                    .attr("for", "linkID"+wicQAndA[j].ID+"textfield")
                                    .css("width", "80%")
                                    .html(wicQAndA[j].question + "<br>")
                                    .append($("<input>")
                                        .addClass("form-control")
                                        .attr("type", "text")
                                        .attr("disabled", true)
                                        .attr("id", "linkID"+wicQAndA[j].ID+"textfield")
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("width", "100%")
                                    )

                            }
                            linkID9Form.append(linkID9);
                            //endregion

                            if (questionGroups[i].groupID == 10 && wicQAndA[j].groupID  == 10) {

                            }
                        }
                    } 

                    leftDiv.append(linkID1Title)
                        .append(linkID1Form)
                        .append(linkID2Title)
                        .append(linkID2Form)
                        .append(linkID3Title)
                        .append(linkID3Form)
                        .append(linkID4Title)
                        .append(linkID4Form)
                        .append(linkID5Title)
                        .append(linkID5Form)
                        .append(linkID6Title)
                        .append(linkID6Form)
                        .append(linkID7Title)
                        .append(linkID7Form);

                    rightDiv.append(linkID8Title)
                        .append(linkID8Form)
                        .append(linkID9Title)
                        .append(linkID9Form);

                    wicSurvey.append(leftDiv);
                    wicSurvey.append(rightDiv);

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
