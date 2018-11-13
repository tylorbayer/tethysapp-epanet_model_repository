from django.http import JsonResponse

import os, tempfile

from hs_restclient import HydroShare
from tethys_services.backends.hs_restclient_helper import get_oauth_hs

message_template_wrong_req_method = 'This request can only be made through a "{method}" AJAX call.'
message_template_param_unfilled = 'The required "{param}" parameter was not fulfilled.'


def get_epanet_model_list(request):
    return_obj = {
        'success': False,
        'message': None,
        'model_list': None,
    }

    if request.is_ajax() and request.method == 'GET':
        try:
            hs = get_oauth_hs(request)
        except:
            hs = HydroShare()

        model_list = []

        try:
            for model in hs.resources(resourceType="ModelInstanceResource", subject="epanet"):
                science_metadata_json = hs.getScienceMetadata(model['resource_id'])

                subjects = []

                if not science_metadata_json['subjects'] is None:
                    for subject in science_metadata_json['subjects']:
                        if subject['value'] == 'EPANET_2.0':
                            continue

                        subjects.append(subject['value'])

                model_list.append({
                    'title': model['resource_title'],
                    'id': model['resource_id'],
                    'owner': model['creator'],
                    'public': model['public'],
                    'shareable': model['shareable'],
                    'discoverable': model['discoverable'],
                    'subjects': subjects
                })

            return_obj['model_list'] = model_list
            return_obj['success'] = True

        except:
            return_obj['message'] = 'The HydroShare server appears to be down.'
    else:
        return_obj['error'] = message_template_wrong_req_method.format(method="GET")

    return JsonResponse(return_obj)


def upload_epanet_model(request):
    return_obj = {
        'success': False,
        'message': None,
        'results': "",
    }

    if request.is_ajax() and request.method == 'POST':
        try:
            hs = get_oauth_hs(request)
        except:
            hs = HydroShare()

        model_title = request.POST['model_title']
        resource_filename = model_title + ".inp"

        abstract = request.POST['model_description'] + '\n{%EPANET Model Repository%}'
        title = model_title

        user_keywords = ["EPANET_2.0"]
        for keyword in request.POST['model_keywords'].split(","):
            user_keywords.append(keyword)
        keywords = (tuple(user_keywords))

        rtype = 'ModelInstanceResource'
        extra_metadata = '{"modelProgram": "EPANET_2.0"}'

        fd, path = tempfile.mkstemp()
        with os.fdopen(fd, 'w') as tmp:
            tmp.write(request.POST['model_file'])
            fpath = path

        metadata = '[{"creator":{"name":"' + hs.getUserInfo()['first_name'] + ' ' + hs.getUserInfo()['last_name'] + '"}}]'

        resource_id = hs.createResource(rtype, title, resource_file=fpath, resource_filename=resource_filename, keywords=keywords, abstract=abstract, metadata=metadata, extra_metadata=extra_metadata)

        hs.setAccessRules(resource_id, public=True)

        return_obj['results'] = resource_id
        return_obj['success'] = True

    else:
        return_obj['message'] = message_template_wrong_req_method.format(method="GET")

    return JsonResponse(return_obj)


def download_epanet_model(request):
    return_obj = {
        'success': False,
        'message': None,
        'results': "",
        'name': ""
    }

    if request.is_ajax() and request.method == 'GET':
        if not request.GET.get('model_id'):
            return_obj['message'] = message_template_param_unfilled.format(param='model_id')
        else:
            model_id = request.GET['model_id']

            try:
                hs = get_oauth_hs(request)
            except:
                hs = HydroShare()

            for model_file in hs.getResourceFileList(model_id):
                model_url = model_file['url']
                model_name = model_url[model_url.find('contents/') + 9:]

                model = ""
                for line in hs.getResourceFile(model_id, model_name):
                    model += line

                return_obj['name'] = model_name
                return_obj['results'] = model
                return_obj['success'] = True

    else:
        return_obj['message'] = message_template_wrong_req_method.format(method="POST")

    return JsonResponse(return_obj)


def get_epanet_model_metadata(request):
    return_obj = {
        'success': False,
        'message': None,
        'results': "",
    }

    if request.is_ajax() and request.method == 'GET':
        if not request.GET.get('model_id'):
            return_obj['message'] = message_template_param_unfilled.format(param='model_id')
        else:
            model_id = request.GET['model_id']

            try:
                hs = get_oauth_hs(request)
            except:
                hs = HydroShare()

            metadata_json = hs.getScienceMetadata(model_id)
            return_obj['results'] = metadata_json
            return_obj['success'] = True

    else:
        return_obj['message'] = message_template_wrong_req_method.format(method="GET")

    return JsonResponse(return_obj)
