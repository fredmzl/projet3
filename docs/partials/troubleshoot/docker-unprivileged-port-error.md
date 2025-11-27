??? danger "Docker : Erreur Permission Denied sur ip_unprivileged_port_start"

    ### 🔴 Symptômes

    Lors du démarrage d'un conteneur Docker (PostgreSQL, etc.), l'erreur suivante apparaît :

    ```bash
    docker compose up 

    Attaching to postgresql-1
    Error response from daemon: failed to create task for container: failed to create shim task: 
    OCI runtime create failed: runc create failed: unable to start container process: 
    error during container init: open sysctl net.ipv4.ip_unprivileged_port_start file: 
    reopen fd 8: permission denied: unknown
    ```

    ---

    ### 🔍 Cause

    Ce problème est causé par un **bug dans containerd >= 1.7.28-2** (ou runc >= 1.3.3) lors de l'accès au fichier système `net.ipv4.ip_unprivileged_port_start` sur les systèmes utilisant **cgroup v2**.

    **Références :**
    
    - [Issue Docker moby/moby#47610](https://github.com/moby/moby/issues/47610)
    - [Issue containerd/containerd#10776](https://github.com/containerd/containerd/issues/10776)

    ---

    ### ✅ Solution : Rétrograder containerd

    La solution consiste à rétrograder vers **containerd 1.7.28-1** qui ne contient pas ce bug.

    **Étape 1 : Vérifier la version actuelle et les versions dispos**

    ```bash
    containerd --version
    apt-cache madison containerd.io
    ```

    Si la version est >= 1.7.28-2, procédez à la rétrogradation.

    **Étape 2 : Rétrograder containerd**

    ```bash
    sudo apt install containerd.io=1.7.28-1~debian.13~trixie
    ```

    **Étape 3 : Bloquer la mise à jour automatique (optionnel)**

    Pour éviter que containerd ne soit mis à jour automatiquement :

    ```bash
    sudo apt-mark hold containerd
    ```

    Pour débloquer plus tard :

    ```bash
    sudo apt-mark unhold containerd
    ```

    **Étape 4 : Redémarrer Docker**

    ```bash
    sudo systemctl restart docker
    ```

    **Étape 5 : Vérifier le fonctionnement**

    ```bash
    docker compose up -d
    docker ps
    ```

    ---

    ### 📊 Diagnostic supplémentaire

    **Vérifier cgroup version**

    ```bash
    stat -fc %T /sys/fs/cgroup/
    # Si retourne "cgroup2fs" → cgroup v2 (concerné par le bug)
    ```

    **Vérifier les permissions du fichier sysctl**

    ```bash
    ls -la /proc/sys/net/ipv4/ip_unprivileged_port_start
    # Devrait afficher : -rw-r--r-- 1 root root
    ```

    **Lire la valeur actuelle**

    ```bash
    cat /proc/sys/net/ipv4/ip_unprivileged_port_start
    # Par défaut : 1024 (ports < 1024 nécessitent des privilèges)
    ```

    ---

    ### ⚠️ Notes importantes

    !!! warning "Version de containerd"
        - ✅ **Fonctionnel** : containerd <= 1.7.28
        - ❌ **Problématique** : containerd >= 1.7.29
        - 🔄 **En attente** : Correctif dans une version future

    !!! tip "Pour les environnements de production"
        - Bloquez la version de containerd avec `apt-mark hold`
        - Documentez la version utilisée dans vos playbooks Ansible/Terraform
        - Surveillez les release notes pour le correctif officiel

    !!! info "Impact"
        Ce bug affecte **tous les conteneurs** qui tentent d'accéder aux paramètres réseau système, pas uniquement PostgreSQL.
