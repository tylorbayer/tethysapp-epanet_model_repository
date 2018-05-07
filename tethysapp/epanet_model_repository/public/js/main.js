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
    var dataTableLoadModels,
        ownerFilters,
        subjectFilters;

    //  *********FUNCTIONS***********
    var addListenersToModelRepTable,
        addListenersToFilters,
        refreshFilters,
        addInitialEventListeners,
        buildModelRepTable,
        populateFilter,
        generateModelList,
        initializeJqueryVariables,
        addDefaultBehaviorToAjax,
        checkCsrfSafe,
        getCookie;

    //  **********Query Selectors************
    var $modelRep,
        $ownerFilters,
        $subjectFilters;

    /******************************************************
     **************FUNCTION DECLARATIONS*******************
     ******************************************************/

    addListenersToModelRepTable = function () {
        $modelRep.find('tbody tr').on('click', function () {
            $(this).unbind()
                .dblclick(function () {
                    var $rdoRes = $('.rdo-model:checked');
                    var modelId = $rdoRes.val();
                    var curURL = window.location.href;
                    window.open(curURL.substring(0, curURL.indexOf('/apps/') + 6) + "epanet-model-viewer/?modelID=" + modelId,"_self");
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

    addListenersToFilters = function () {
        $ownerFilters.find('li').on('click', function () {
            refreshFilters();
            dataTableLoadModels.draw();
        });

        $subjectFilters.find('li').on('click', function () {
            refreshFilters();
            dataTableLoadModels.draw();
        });
    };

    $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
        var owner = data[4];
        var subjects = data[2].split(', ');

        if (typeof ownerFilters == 'undefined' || typeof subjectFilters == 'undefined' ||
            (subjectFilters.length == 0 && ownerFilters.length == 0))
            return true;
        else {
            if (subjectFilters.length == 0)
                return (ownerFilters.indexOf(owner) > -1);
            else if (ownerFilters.length == 0) {
                var add = false;

                for (var i in subjects) {
                    if (subjectFilters.indexOf(subjects[i]) > -1)
                        add = true;
                }

                return add;
            }
            else {
                if (ownerFilters.indexOf(owner) > -1) {
                    var add = false;

                    for (var i in subjects) {
                        if (subjectFilters.indexOf(subjects[i]) > -1)
                            add = true;
                    }

                    return add;
                }
                else
                    return false;
            }
        }
    });

    refreshFilters = function () {
        ownerFilters = [];
        subjectFilters = [];

        $ownerFilters.find('input').each(function () {
            if ($(this).is(":checked"))
                ownerFilters.push($(this).val());
        });

        $subjectFilters.find('input').each(function () {
            if ($(this).is(":checked"))
                subjectFilters.push($(this).val());
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
        var owners = {};
        var subjects = {};

        var modelTableHtml;

        modelList = typeof modelList === 'string' ? JSON.parse(modelList) : modelList;
        modelTableHtml = '<table id="tbl-models"><thead><th></th><th>Title</th><th>Subjects</th><th>Type</th><th>Owner</th></thead><tbody>';

        modelList.forEach(function (model) {
            if (model.owner in owners)
                owners[model.owner] += 1;
            else
                owners[model.owner] = 1;

            model.subjects.forEach(function (subject) {
                if (subject in subjects)
                    subjects[subject] += 1;
                else
                    subjects[subject] = 1;
            });

            modelTableHtml += '<tr>' +
                '<td><input type="radio" name="model" class="rdo-model" value="' + model.id + '"></td>' +
                '<td class="model_title">' + model.title + '</td>' +
                '<td class="model_subjects">' + model.subjects.join(', ') + '</td>' +
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

        populateFilter($ownerFilters, "owner", owners);
        populateFilter($subjectFilters, "subject", subjects);
        addListenersToFilters();
    };

    populateFilter = function (filterContainer, filterType, filterList) {
        var filterHTML;
        var identifier;

        for (var filter in filterList) {
            identifier = filterType + "-" + filter;

            filterHTML = '<li class="list-group-item" rel="' + filterType + ',' + filter + '"><span class="badge">' + filterList[filter] +
                '</span><label class="checkbox noselect"><input type="checkbox" id="' + identifier + '" value="' + filter + '">' +
                filter + '</label></li>';

            filterContainer.append(filterHTML);
        }
    };

    initializeJqueryVariables = function () {
        $modelRep = $('#model-rep');
        $ownerFilters = $('#list-group-owner');
        $subjectFilters = $('#list-group-subject');
    };

    /*-----------------------------------------------
     ********CORRECT POST REQUEST FUNCTIONS**********
     ----------------------------------------------*/

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