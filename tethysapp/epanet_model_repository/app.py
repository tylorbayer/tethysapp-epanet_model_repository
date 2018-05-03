from tethys_sdk.base import TethysAppBase, url_map_maker


class EpanetModelRepository(TethysAppBase):
    """
    Tethys app class for EPANET Model Repository.
    """

    name = 'EPANET Model Repository'
    index = 'epanet_model_repository:home'
    icon = 'epanet_model_repository/images/CIMM.png'
    package = 'epanet_model_repository'
    root_url = 'epanet-model-repository'
    color = '#006699'
    description = 'Place a brief description of your app here.'
    tags = 'EPANET'
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='epanet-model-repository',
                controller='epanet_model_repository.controllers.home'
            ),
        )

        return url_maps
