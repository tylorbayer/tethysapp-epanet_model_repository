/*****************************************************************************
 * FILE:    Main
 * DATE:    2/7/2018
 * AUTHOR:  Tylor Bayer
 * COPYRIGHT: (c) 2018 Brigham Young University
 * LICENSE: BSD 2-Clause
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/
(function packageEPANETModelRepository() {

    "use strict"; // And enable strict mode for this library

    /************************************************************************
     *                      MODULE LEVEL / GLOBAL VARIABLES
     *************************************************************************/
    var dataTableLoadModels;

    //  *********FUNCTIONS***********
    var addListenersToModelRepTable,
        addInitialEventListeners,
        buildModelRepTable,
        generateModelList,
        initializeJqueryVariables,
        addDefaultBehaviorToAjax,
        checkCsrfSafe,
        getCookie;

    //  **********Query Selectors************
    var $modelRep;

    /******************************************************
     **************FUNCTION DECLARATIONS*******************
     ******************************************************/

    addListenersToModelRepTable = function () {
        $modelRep.find('tbody tr').on('click', function () {
            $(this).unbind()
                .dblclick(function () {
                    console.log("model clicked!!");
                })
                .css({
                    'background-color': '#1abc9c',
                    'color': 'white'
                })
                .find('input').prop('checked', true);
            $('tr').not($(this)).css({
                'background-color': '',
                'color': ''
            });
        });
    };

    addInitialEventListeners = function () {

    };

    generateModelList = function (numRequests) {
        $.ajax({
            type: 'GET',
            url: '/apps/epanet-model-repository/get-epanet-model-list',
            dataType: 'json',
            error: function () {
                if (numRequests < 5) {
                    numRequests += 1;
                    setTimeout(generateModelList(), 3000);
                } else {
                    $modelRep.html('<div class="error">An unexpected error was encountered while attempting to load models.</div>');
                }
            },
            success: function (response) {
                if (response.hasOwnProperty('success')) {
                    if (!response.success) {
                        $modelRep.html('<div class="error">' + response.message + '</div>');
                    } else {
                        if (response.hasOwnProperty('model_list')) {
                            buildModelRepTable(response.model_list);
                        }
                    }
                }
            }
        });
    };

    buildModelRepTable = function (modelList) {
        var modelTableHtml;

        modelList = typeof modelList === 'string' ? JSON.parse(modelList) : modelList;
        modelTableHtml = '<table id="tbl-models"><thead><th></th><th>Title</th><th>Subjects</th><th>Type</th><th>Owner</th></thead><tbody>';

        modelList.forEach(function (model) {
            var subjects = "";

            for (var subject in model.subjects) {
                subjects += subject + " ";
            }

            modelTableHtml += '<tr>' +
                '<td><input type="radio" name="model" class="rdo-model" value="' + model.id + '"></td>' +
                '<td class="model_title">' + model.title + '</td>' +
                '<td class="model_subjects">' + model.subjects + '</td>' +
                '<td class="model_type">' + model.type + '</td>' +
                '<td class="model_owner">' + model.owner + '</td>' +
                '</tr>';
        });
        modelTableHtml += '</tbody></table>';
        $modelRep.html(modelTableHtml);
        addListenersToModelRepTable();
        dataTableLoadModels = $('#tbl-models').DataTable({
            'order': [[1, 'asc']],
            'columnDefs': [{
                'orderable': false,
                'targets': 0
            }],
            "scrollY": '500px',
            "scrollCollapse": true,
            fixedHeader: {
                header: true,
                footer: true
            }
        });
    };

    addDefaultBehaviorToAjax = function () {
        // Add CSRF token to appropriate ajax requests
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (!checkCsrfSafe(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
                }
            }
        });
    };

    // Find if method is CSRF safe
    checkCsrfSafe = function (method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    };

    getCookie = function (name) {
        var cookie;
        var cookies;
        var cookieValue = null;
        var i;

        if (document.cookie && document.cookie !== '') {
            cookies = document.cookie.split(';');
            for (i = 0; i < cookies.length; i += 1) {
                cookie = $.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    initializeJqueryVariables = function () {
        $modelRep = $('#model-rep');
    };

    /*-----------------------------------------------
     **************ONLOAD FUNCTION*******************
     ----------------------------------------------*/
    $(function () {
        initializeJqueryVariables();
        addInitialEventListeners();
        addDefaultBehaviorToAjax();
    });

    /*-----------------------------------------------
     ***************INVOKE IMMEDIATELY***************
     ----------------------------------------------*/
    generateModelList();

}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.