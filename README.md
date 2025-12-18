Création d'un site de gestion d'evenements respectant l'énoncé donné. 

- 4 micro services ( authentification, event, participant, notification ) en plus des micro services techniques ( eureka et API gateway sur port 9090 )
- Implémentation d'un systeme d'authentification sécurisé ( hachage de mot de passe, utilisation de JWT ( TOKEN généré sur JWTutils, application.yaml clé secrete et expiration sur 24h )
- Implémentation d'un systeme d'evaluation des events ( note sur 5 'etoiles' et commentaires )
- Chaque micro service a sa propre base de données ( authdb, eventdb, participant_db, notification_db ), base de données H2 persistante.
- 5 composants ( authentification, dashboard, home, organizer, participant )


  Toutes les fonctionnalités de l'enoncé sont implémentées et fonctionnelles ( voir vidéos de démonstration .mp4 )
  
  Organisateur :
  
  -Creer un evenement ( avec image, video et pdf ), modifier un evenement, supprimer un evenement
  
  -Consulter les événements.
  
  -Consulter les participants d'un événement précis
  
  -Consulter les participants relatifs a chaque evenement ( tableau ) et les exporter en .CSV
  
  -Consulter les statistiques d'evenement
  
  -Systeme de notifications automatique sur le dashboard du participant si jamais l'organisateur modifie ou supprime un event ou le participant est inscrit
  
  -L'organisateur peut envoyer une notification manuelle ( en envoyant via le mail du participant )
  
  -Consulter les évaluations et commentaires des événements terminés

  Participant :

  -Consulter les evenements ( avec leur media ( video, pdf, photo) correspondants), s'inscrire / se désinscrire.
  -Recevoir des notifications automatiques d'inscription / désinscription
  - Si le participant etait inscrit a un evenement, qui est maintenant terminé, il peut attribuer une évaluation ( note de 1 a 5, des étoiles ) puis un commentaire ( 1000 caracteres max )
  - il peut aussi consulter les évaluations des autres participants sur cet événement. 

  PS : deux types de notifications : les notifs automatiques, et aussi les notifs manuelles que l organisateur peut envoyer au participant en utilisant son mail.


  Merci de regarder les vidéos de démonstration déposées sur le repository.


  

  
