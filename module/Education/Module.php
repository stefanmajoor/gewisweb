<?php
namespace Education;

class Module
{

    /**
     * Get the autoloader configuration.
     *
     * @return array Autoloader config
     */
    public function getAutoloaderConfig()
    {
        return array(
            'Zend\Loader\StandardAutoloader' => array(
                'namespaces' => array(
                    __NAMESPACE__ => __DIR__ . '/src/' . __NAMESPACE__,
                )
            )
        );
    }

    /**
     * Get the configuration for this module.
     *
     * @return array Module configuration
     */
    public function getConfig()
    {
        return include __DIR__ . '/config/module.config.php';
    }

    /**
     * Get service configuration.
     *
     * @return array Service configuration
     */
    public function getServiceConfig()
    {
        return array(
            'invokables' => array(
                'education_service_exam' => 'Education\Service\Exam',
                'education_service_oase' => 'Education\Service\Oase'
            ),
            'factories' => array(
                'education_form_upload' => function ($sm) {
                    $form = new \Education\Form\Upload(
                        $sm->get('translator')
                    );
                    $form->setHydrator($sm->get('education_hydrator_exam'));
                    return $form;
                },
                'education_form_searchcourse' => function ($sm) {
                    return new \Education\Form\SearchCourse(
                        $sm->get('translator')
                    );
                },
                'education_mapper_exam' => function ($sm) {
                    return new \Education\Mapper\Exam(
                        $sm->get('education_doctrine_em')
                    );
                },
                'education_mapper_course' => function ($sm) {
                    return new \Education\Mapper\Course(
                        $sm->get('education_doctrine_em')
                    );
                },
                'education_mapper_study' => function ($sm) {
                    return new \Education\Mapper\Study(
                        $sm->get('education_doctrine_em')
                    );
                },
                'education_hydrator_study' => function ($sm) {
                    return new \DoctrineModule\Stdlib\Hydrator\DoctrineObject(
                        $sm->get('education_doctrine_em'),
                        'Education\Model\Study'
                    );
                },
                'education_hydrator_course' => function ($sm) {
                    return new \DoctrineModule\Stdlib\Hydrator\DoctrineObject(
                        $sm->get('education_doctrine_em'),
                        'Education\Model\Course'
                    );
                },
                'education_hydrator_exam' => function ($sm) {
                    return new \DoctrineModule\Stdlib\Hydrator\DoctrineObject(
                        $sm->get('education_doctrine_em'),
                        'Education\Model\Exam'
                    );
                },
                'education_oase_soapclient' => function ($sm) {
                    $config = $sm->get('config');
                    $config = $config['oase']['soap'];
                    return new \Zend\Soap\Client(
                        $config['wsdl'], $config['options']
                    );
                },
                'education_oase_client' => function ($sm) {
                    return new \Education\Oase\Client(
                        $sm->get('education_oase_soapclient')
                    );
                },
                'education_oase_service_course' => function ($sm) {
                    $service = new \Education\Oase\Service\Course(
                        $sm->get('education_oase_client')
                    );
                    $service->setHydrator($sm->get('education_hydrator_course'));
                    return $service;
                },
                'education_oase_service_study' => function ($sm) {
                    $service = new \Education\Oase\Service\Study(
                        $sm->get('education_oase_client')
                    );
                    $config = $sm->get('config');
                    $config = $config['oase']['studies'];
                    $service->setKeywords($config['keywords']);
                    $service->setNegativeKeywords($config['negative_keywords']);
                    $service->setGroupIds($config['group_ids']);
                    $service->setEducationTypes($config['education_types']);
                    $service->setHydrator($sm->get('education_hydrator_study'));
                    return $service;
                },
                'education_acl' => function ($sm) {
                    $acl = $sm->get('acl');

                    // add resource
                    $acl->addResource('exam');

                    // users (logged in GEWIS members) are allowed to view exams
                    // TODO: besides users, also people on the TU/e network
                    // are allowed to view exams
                    $acl->allow('user', 'exam', 'view');

                    return $acl;
                },
                // fake 'alias' for entity manager, because doctrine uses an abstract factory
                // and aliases don't work with abstract factories
                'education_doctrine_em' => function ($sm) {
                    return $sm->get('doctrine.entitymanager.orm_default');
                }
            )
        );
    }

    /**
     * Get view helper configuration.
     *
     * @return array
     */
    public function getViewHelperConfig()
    {
        return array(
            'factories' => array(
                'examUrl' => function ($sm) {
                    $locator = $sm->getServiceLocator();
                    $config = $locator->get('config');
                    $helper = new \Education\View\Helper\ExamUrl();
                    $helper->setDir($config['education']['public_dir']);
                    $helper->setExamService($locator->get('education_service_exam'));
                    return $helper;
                }
            )
        );
    }
}
