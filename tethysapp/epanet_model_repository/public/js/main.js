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
    let dataTableLoadModels,
        ownerFilters,
        subjectFilters,
        availabilityFilters,
        showLog;

    //  **********FUNCTIONS***********
    let addListenersToModelRepTable,
        addListenersToFilters,
        refreshFilters,
        addInitialEventListeners,
        buildModelRepTable,
        populateFilter,
        sortFilter,
        generateModelList,
        onClickOpenModel,
        uploadModel,
        resetUploadState,
        initializeJqueryVariables,
        addMetadataToModal,
        addDefaultBehaviorToAjax,
        checkCsrfSafe,
        getCookie,
        addLogEntry;

    //  **********Query Selectors************
    let $modelRep,
        $ownerFilters,
        $subjectFilters,
        $availabilityFilters,
        $loadFromLocal,
        $btnUl,
        $btnUlCancel,
        $inpUlTitle,
        $inpUlDescription,
        $inpUlKeywords,
        $btnOpenModel,
        $btnOpenModelViewer,
        $btnDownload,
        $btnMetadata,
        $modalMetadata;

    /******************************************************
     **************FUNCTION DECLARATIONS*******************
     ******************************************************/

    addInitialEventListeners = function () {
        $btnOpenModelViewer.click(function () {
            onClickOpenModel();
        });

        $btnDownload.click(function () {
            $('#load-anim').html('<div id="img-dl"><img src="/static/epanet_model_viewer/images/loading-animation.gif">' +
                '<br><p><b>Downloading model...</b></p><p>Note: Don\'t close app.</p></div>');
            let modelId = $('.rdo-model:checked').val();
            let data = {'model_id': modelId};

            $.ajax({
                type: 'GET',
                url: '/apps/epanet-model-repository/download-epanet-model',
                dataType: 'json',
                data: data,
                error: function () {
                    let message = 'An unexpected error ocurred while processing the following model ' +
                        '<a href="https://www.hydroshare.org/resource/' + modelId + '" target="_blank">' +
                        modelId + '</a>. An app admin has been notified.';

                    addLogEntry('danger', message);
                    $('#img-dl').remove();
                },
                success: function (response) {
                    let message;

                    if (response.hasOwnProperty('success')) {
                        if (response.hasOwnProperty('message')) {
                            message = response.message;
                        }

                        if (!response.success) {
                            if (!message) {
                                message = 'An unexpected error ocurred while processing the following model ' +
                                    '<a href="https://www.hydroshare.org/resource/' + modelId + '" target="_blank">' +
                                    modelId + '</a>. An app admin has been notified.';
                            }

                            addLogEntry('danger', message);
                        } else {
                            if (message) {
                                addLogEntry('warning', message);
                            }
                            if (response.hasOwnProperty('results')) {
                                let modelFile = response.results;

                                let blob = new Blob([modelFile], {type: 'text/plain;charset=utf-8;'});

                                let filename = response.name;

                                if (navigator.msSaveBlob) { // IE 10+
                                    navigator.msSaveBlob(blob, filename);
                                }
                                else {
                                    let link = document.createElement("a");
                                    if (link.download !== undefined) { // feature detection
                                        // Browsers that support HTML5 download attribute
                                        let url = URL.createObjectURL(blob);
                                        link.setAttribute("href", url);
                                        link.setAttribute("download", filename);
                                        link.style.visibility = 'hidden';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    } else { // If the internet browser is not compatible with this feature
                                        $("#merge_form").submit();
                                    }
                                }
                                alert("Model file successfully downloaded to Downloads folder");
                            }
                        }
                    }
                    $('#img-dl').remove();
                }
            });
        });

        $btnMetadata.click(function () {
            $modalMetadata.find('.modal-body').html('<img src="/static/epanet_model_viewer/images/loading-animation.gif">' +
                '<br><p><b>Loading model metadata...</b></p><p>Note: Don\'t close window.</p>');

            let modelId = $('.rdo-model:checked').val();
            let data = {'model_id': modelId};

            $.ajax({
                type: 'GET',
                url: '/apps/epanet-model-repository/get-epanet-model-metadata',
                dataType: 'json',
                data: data,
                error: function () {
                    let message = 'An unexpected error ocurred while processing the following model ' +
                        '<a href="https://www.hydroshare.org/resource/' + modelId + '" target="_blank">' +
                        modelId + '</a>. An app admin has been notified.';

                    addLogEntry('danger', message);
                },
                success: function (response) {
                    let message;

                    if (response.hasOwnProperty('success')) {
                        if (response.hasOwnProperty('message')) {
                            message = response.message;
                        }

                        if (!response.success) {
                            if (!message) {
                                message = 'An unexpected error ocurred while processing the following model ' +
                                    '<a href="https://www.hydroshare.org/resource/' + modelId + '" target="_blank">' +
                                    modelId + '</a>. An app admin has been notified.';
                            }

                            addLogEntry('danger', message);
                        } else {
                            if (message) {
                                addLogEntry('warning', message);
                            }
                            if (response.hasOwnProperty('results')) {
                                addMetadataToModal(response.results);
                            }
                        }
                    }
                }
            });
        });

        $btnUl.click(function() {
            if ($loadFromLocal.val() !== '' && $inpUlTitle.val() !== '' && $inpUlDescription.val() !== '' && $inpUlKeywords.val() !== '') {
                let data = new FormData();
                data.append('model_title', $inpUlTitle.val());
                data.append('model_description', $inpUlDescription.val());
                data.append('model_keywords', $inpUlKeywords.tagsinput('items'));

                let file = $loadFromLocal[0].files[0];
                let reader = new FileReader();
                reader.onload = function() {
                    data.append('model_file', reader.result);
                    uploadModel(data);
                };
                reader.readAsText(file);

                $('#modal-upload').modal('hide');
                resetUploadState();
            }
            else {
                alert("Fields not entered correctly. Cannot upload model to Hydroshare. Fill the correct fields in and try again.");
            }
        });

        $btnUlCancel.click(function() {
            resetUploadState();
        });
    };

    addMetadataToModal = function (metadata) {
        let metadataHTML = '<p><h1>' + metadata['title'] + '</h1><h6>' + metadata['description'] + '</h6>' +
            '<a href="' + metadata['identifiers'][0]['url'] + '" style="color:#3366ff">View the Model in HydroShare</a><br><br>' +
            'Created: ' + metadata['dates'][1]['start_date'].substring(0, 10) +
            ', &emsp;Last Modified: ' + metadata['dates'][1]['start_date'].substring(0, 10) +
            '<br>Author: ' + metadata['creators'][0]['name'] + '<br>Rights: ' + metadata['rights'];

        let subjects = "";
        let i;
        for (i in metadata['subjects']) {
            subjects += metadata['subjects'][i]['value'] + ', ';
        }
        metadataHTML += '<br>Subjects: ' + subjects.substring(0, subjects.length - 2);


        try {
            metadataHTML += '<br> Program: ' + '<a href="' + metadata['executed_by']['modelProgramIdentifier'] +
                '" style="color:#3366ff">' + metadata['executed_by']['modelProgramName'] + '</a>';
        }
        catch (error) {
            //    No program included in metadata
        }


        metadataHTML += '</p><br>';

        metadataHTML += '<div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#metadata-json">&nbsp; Raw Metadata JSON<span class="glyphicon glyphicon-minus pull-left"></span></a></h4></div><div id="metadata-json" class="filter-list panel-collapse collapse"><pre>' + JSON.stringify(metadata, null, 2) + '</pre></div></div>';

        $modalMetadata.find('.modal-body').html(metadataHTML);
    };

    addListenersToModelRepTable = function () {
        $modelRep.find('tbody tr').on('click', function () {
            $btnOpenModel.prop('disabled', false);
            $btnMetadata.prop('disabled', false);
            $btnDownload.prop('disabled', false);

            $(this)
                .dblclick(function (evt) {
                    evt.stopImmediatePropagation();
                    onClickOpenModel();
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

        $('[data-toggle="tooltip"]').tooltip();
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

        $availabilityFilters.find('li').on('click', function () {
            refreshFilters();
            dataTableLoadModels.draw();
        });

        $('#owner').on('shown.bs.collapse', function() {
            $("#icon-owner").addClass('glyphicon-minus').removeClass('glyphicon-plus');
        });
        $('#owner').on('hidden.bs.collapse', function() {
            $("#icon-owner").addClass('glyphicon-plus').removeClass('glyphicon-minus');
        });

        $('#subject').on('shown.bs.collapse', function() {
            $("#icon-suject").addClass('glyphicon-minus').removeClass('glyphicon-plus');
        });
        $('#subject').on('hidden.bs.collapse', function() {
            $("#icon-suject").addClass('glyphicon-plus').removeClass('glyphicon-minus');
        });

        $('#availability').on('shown.bs.collapse', function() {
            $("#icon-availability").addClass('glyphicon-minus').removeClass('glyphicon-plus');
        });
        $('#availability').on('hidden.bs.collapse', function() {
            $("#icon-availability").addClass('glyphicon-plus').removeClass('glyphicon-minus');
        });
    };

    onClickOpenModel = function () {
        let modelId = $('.rdo-model:checked').val();
        let curURL = window.location.href;
        window.open(curURL.substring(0, curURL.indexOf('/apps/') + 6) + "epanet-model-viewer/?modelID=" + modelId, "_blank");
    };

    $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
        let ownAdd = false;
        let subAdd  = false;
        let avaAdd  = false;

        let owner = data[4];
        let subjects = data[2].split(', ');
        let availability = data[3];

        if (typeof ownerFilters === 'undefined' || typeof subjectFilters === 'undefined' || typeof subjectFilters === 'undefined' ||
            (subjectFilters.length === 0 && ownerFilters.length === 0 && availabilityFilters.length === 0))
            return true;
        else {
            if (ownerFilters.length > 0)
                ownAdd = (ownerFilters.indexOf(owner) > -1);
            else
                ownAdd = true;

            if (subjectFilters.length > 0) {
                for (let i in subjects) {
                    if (subjectFilters.indexOf(subjects[i]) > -1) {
                        subAdd = true;
                    }
                }
            }
            else
                subAdd = true;

            if (availabilityFilters.length > 0) {
                for (let i in availabilityFilters) {
                    if (availability.indexOf(availabilityFilters[i]) > -1) {
                        avaAdd = true;
                    }
                }
            }
            else
                avaAdd = true;

            return (ownAdd && subAdd && avaAdd);
        }
    });

    refreshFilters = function () {
        ownerFilters = [];
        subjectFilters = [];
        availabilityFilters =[];

        $ownerFilters.find('input').each(function () {
            if ($(this).is(":checked"))
                ownerFilters.push($(this).val());
        });

        $subjectFilters.find('input').each(function () {
            if ($(this).is(":checked"))
                subjectFilters.push($(this).val());
        });

        $availabilityFilters.find('input').each(function () {
            if ($(this).is(":checked"))
                availabilityFilters.push($(this).val());
        });
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
                        $btnDownload.removeClass('hidden');
                        $btnMetadata.removeClass('hidden');
                        $btnOpenModel.removeClass('hidden');
                    }
                }
            }
        });
    };

    buildModelRepTable = function (modelList) {
        let owners = {};
        let subjects = {};
        let availability = {
            public: 0,
            discoverable: 0,
            private: 0,
            shareable: 0,
            nonShareable: 0
        };

        let modelTableHtml;

        modelList = typeof modelList === 'string' ? JSON.parse(modelList) : modelList;
        modelTableHtml = '<table id="tbl-models"><thead><th></th><th>Title</th><th>Subjects</th><th> Info</th><th>Owner</th></thead><tbody>';

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
                '<td class="model_subjects">' + model.subjects.join(', ') + '</td>';

            let modelInfoHtml = "";

            if (model.public === true) {
                modelInfoHtml += 'p<img src="/static/epanet_model_repository/images/public.png" data-toggle="tooltip" data-placement="right" title="Public">';
                availability["public"] += 1;
            }
            else
            if (model.discoverable === true) {
                modelInfoHtml += 'd<img src="/static/epanet_model_repository/images/discoverable.png" data-toggle="tooltip" data-placement="right" title="Discoverable">';
                availability["discoverable"] += 1;
            }
            else {
                modelInfoHtml += 'r<img src="/static/epanet_model_repository/images/private.png" data-toggle="tooltip" data-placement="right" title="Private">';
                availability["private"] += 1;
            }
            if (model.shareable === true) {
                modelInfoHtml += 's<img src="/static/epanet_model_repository/images/shareable.png" data-toggle="tooltip" data-placement="right" title="Shareable">';
                availability["shareable"] += 1;
            }
            else {
                modelInfoHtml += 'n<img src="/static/epanet_model_repository/images/non-shareable.png" data-toggle="tooltip" data-placement="right" title="Not Shareable">';
                availability["nonShareable"] += 1;
            }

            modelTableHtml += '<td class="model_info">' + modelInfoHtml + '</td>' +
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

        $("#bdg-public").html(availability["public"]);
        $("#bdg-discoverable").html(availability["discoverable"]);
        $("#bdg-private").html(availability["private"]);
        $("#bdg-shareable").html(availability["shareable"]);
        $("#bdg-non-shareable").html(availability["nonShareable"]);

        sortFilter($ownerFilters);
        sortFilter($subjectFilters);
        sortFilter($availabilityFilters);

        addListenersToFilters();
    };

    populateFilter = function (filterContainer, filterType, filterList) {
        let filterHTML;
        let identifier;

        filterContainer.empty();

        for (let filter in filterList) {
            identifier = filterType + "-" + filter;

            filterHTML = '<li class="list-group-item" rel="' + filterType + ',' + filter + '"><span class="badge">' + filterList[filter] +
                '</span><label class="checkbox noselect"><input type="checkbox" id="' + identifier + '" value="' + filter + '">' +
                filter + '</label></li>';

            filterContainer.append(filterHTML);
        }
    };

    sortFilter = function ($filterGroup) {
        $filterGroup.find('.list-group-item').sort(function(a, b) {
            return $(b).find('.badge').html() - $(a).find('.badge').html();
        })
            .appendTo($filterGroup);
    };

    uploadModel = function (data) {
        $.ajax({
            type: 'POST',
            url: '/apps/epanet-model-repository/upload-epanet-model/',
            dataType: 'json',
            processData: false,
            contentType: false,
            data: data,
            error: function () {
                let message = 'An unexpected error occurred while uploading the model ';

                addLogEntry('danger', message);
            },
            success: function (response) {
                let message;

                if (response.hasOwnProperty('success')) {
                    if (response.hasOwnProperty('message')) {
                        message = response.message;
                    }

                    if (!response.success) {
                        if (!message) {
                            message = 'An unexpected error occurred while uploading the model';
                        }

                        addLogEntry('danger', message);
                    } else {
                        if (message) {
                            addLogEntry('warning', message);
                        }
                        $modelRep.html('<img src="/static/epanet_model_viewer/images/loading-animation.gif">' +
                            '<br><p><b>Loading model repository...</b></p><p>Note: Loading will continue if dialog is closed.</p>');
                        alert("Model has successfully been uploaded to HydroShare.");
                        generateModelList();
                    }
                }
            }
        });
    };

    resetUploadState = function() {
        $('#frm-upload')[0].reset();
        $inpUlKeywords.tagsinput('removeAll');
    };

    addLogEntry = function (type, message, show) {
        let icon;
        let timeStamp;

        switch (type) {
            case 'success':
                icon = 'ok';
                break;
            case 'danger':
                icon = 'remove';
                showLog = true;
                break;
            default:
                icon = type;
                showLog = true;
        }

        timeStamp = new Date().toISOString();

        $('#logEntries').prepend('<div class="alert-' + type + '">' +
            '<span class="glyphicon glyphicon-' + icon + '-sign" aria-hidden="true"></span>  '
            + timeStamp + ' *** \t'
            + message +
            '</div><br>');

        if (show) {
            $modalLog.modal('show');
            showLog = false;
        }
    };

    initializeJqueryVariables = function () {
        $modelRep = $('#model-rep');
        $ownerFilters = $('#list-group-owner');
        $subjectFilters = $('#list-group-subject');
        $availabilityFilters = $('#list-group-availability');
        $btnUl = $('#btn-upload');
        $btnUlCancel = $('#btn-upload-cancel');
        $loadFromLocal = $("#load-from-local");
        $inpUlTitle = $('#inp-upload-title');
        $inpUlDescription = $('#inp-upload-description');
        $inpUlKeywords = $('#tagsinp-upload-keywords');
        $btnOpenModel = $('#btn-open-model');
        $btnOpenModelViewer = $('#btn-open-model-viewer');
        $btnDownload = $('#btn-download');
        $btnMetadata = $('#btn-metadata');
        $modalMetadata = $('#modal-metadata');
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
        let cookie;
        let cookies;
        let cookieValue = null;
        let i;

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

    showLog = false;

    /*-----------------------------------------------
     **************ONLOAD FUNCTION*******************
     ----------------------------------------------*/
    $(function () {
        $("#app-content-wrapper").removeClass('show-nav');
        $('.dropdown-toggle').dropdown();

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