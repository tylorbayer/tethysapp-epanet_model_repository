from tethys_sdk.base import TethysAppBase, url_map_maker


class EpanetModelRepository(TethysAppBase):
    """
    Tethys app class for EPANET Model Repository.
    """

    name = 'EPANET Model Repository'
    index = 'epanet_model_repository:home'
    icon = 'epanet_model_repository/images/NCIMM.png'
    package = 'epanet_model_repository'
    root_url = 'epanet-model-repository'
    color = '#006699'
    description = ''
    tags = 'EPANET'
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        url_map = url_map_maker(self.root_url)

        url_maps = (
            url_map(name='home',
                    url='epanet-model-repository',
                    controller='epanet_model_repository.controllers.home'),
            url_map(name='get_epanet_model_list',
                    url='epanet-model-repository/get-epanet-model-list',
                    controller='epanet_model_repository.ajax_controllers.get_epanet_model_list'),
            url_map(name='upload_epanet_model',
                    url='epanet-model-repository/upload-epanet-model',
                    controller='epanet_model_repository.ajax_controllers.upload_epanet_model'),
            url_map(name='download_epanet_model',
                    url='epanet-model-repository/download-epanet-model',
                    controller='epanet_model_repository.ajax_controllers.download_epanet_model'),
            url_map(name='get_epanet_model-metadata',
                    url='epanet-model-repository/get-epanet-model-metadata',
                    controller='epanet_model_repository.ajax_controllers.get_epanet_model_metadata')
        )

        return url_maps
