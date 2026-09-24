    import pandas as pd
    import sys
    import re

    def clean_dataset(df):
        """
        Cleans the dataset: 
        - Ensures 'id' is consistent.
        - Splitting skills into lists.
        """
        # Remove rows that seem to be corrupted or duplicates with floating IDs that are weird
        # (In the preview, some IDs were like 183.236...)
        df = df.dropna(subset=['id', 'skills', 'jobTitle'])
        df['id'] = df['id'].astype(float).astype(int)
        
        # Clean skills: strip whitespace and split by comma
        df['skill_list'] = df['skills'].apply(lambda x: [s.strip().lower() for s in str(x).split(',')])
        df['jobTitle_lower'] = df['jobTitle'].str.lower()
        
        return df

    def extract_requirements(prompt):
        """
        Simple rule-based extraction for common tech skills.
        In a real system, this would call an LLM.
        """
        # Common tech keywords to look for
        common_skills = [
            "python", "javascript", "typescript", "react", "angular", "node.js", "express",
            "docker", "kubernetes", "aws", "azure", "sql", "mongodb", "ci/cd", "linux",
            "machine learning", "nlp", "data analysis", "html", "css", "rest apis"
        ]
        
        # Common roles
        roles = ["frontend", "backend", "full stack", "devops", "data scientist"]
        
        found_skills = []
        for skill in common_skills:
            if skill in prompt.lower():
                found_skills.append(skill)
                
        found_roles = []
        for role in roles:
            if role in prompt.lower():
                found_roles.append(role)
                
        # If no roles found, assume it might be relevant for several
        if not found_roles:
            found_roles = roles
            
        return found_skills, found_roles

    def calculate_priority(row, target_skills, target_roles):
        """
        Priority Logic:
        - Base score: 10 if jobTitle matches target roles.
        - Missing skill bonus: +5 for each target skill the employee DOES NOT have.
        - Relevant skill bonus: +2 for each target skill they ALREADY have (means they have the foundation).
        - If jobTitle doesn't match target roles: reduce score significantly.
        """
        score = 0
        role_match = any(role in row['jobTitle_lower'] for role in target_roles)
        
        if not role_match:
            return 0
        
        score += 10 # Base for being in the right role
        
        missing_skills = []
        has_skills = []
        
        for s in target_skills:
            if s.lower() in row['skill_list']:
                has_skills.append(s)
                score += 2 # फाउंडेशन
            else:
                missing_skills.append(s)
                score += 5 # Need for training
                
        return score

    def main():
        if len(sys.argv) < 2:
            print("Usage: python suggest_training.py \"<training_prompt>\"")
            return

        training_prompt = sys.argv[1]
        csv_path = "employee_dataset_1000.csv"
        
        print(f"\n--- Training Suggestion System ---")
        print(f"Prompt: \"{training_prompt}\"")
        
        try:
            df = pd.read_csv(csv_path)
        except Exception as e:
            print(f"Error loading CSV: {e}")
            return
            
        df = clean_dataset(df)
        
        target_skills, target_roles = extract_requirements(training_prompt)
        
        if not target_skills:
            print("Warning: No specific skills identified from the prompt. Results might be broad.")
        
        print(f"Target Skills Identified: {', '.join(target_skills) if target_skills else 'None'}")
        print(f"Target Roles Identified: {', '.join(target_roles)}")
        
        # Calculate scores
        df['priority_score'] = df.apply(lambda row: calculate_priority(row, target_skills, target_roles), axis=1)
        
        # Sort and get top 5
        top_candidates = df[df['priority_score'] > 0].sort_values(by='priority_score', ascending=False).head(10)
        
        if top_candidates.empty:
            print("\nNo matching employees found for this training profile.")
        else:
            print(f"\nTop {len(top_candidates)} Priority Employees for this Training:")
            print("-" * 80)
            print(f"{'Name':<25} | {'Job Title':<20} | {'Score':<5} | {'Current Relevant Skills'}")
            print("-" * 80)
            for _, row in top_candidates.iterrows():
                name = f"{row['firstName']} {row['lastName']}"
                # Find relevant skills they already have
                already_has = [s for s in target_skills if s.lower() in row['skill_list']]
                already_has_str = ", ".join(already_has) if already_has else "None"
                print(f"{name:<25} | {row['jobTitle'][:20]:<20} | {row['priority_score']:<5} | {already_has_str}")

    if __name__ == "__main__":
        main()
